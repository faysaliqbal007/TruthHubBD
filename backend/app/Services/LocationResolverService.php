<?php

namespace App\Services;

use App\Models\AdminBoundary;
use App\Models\GeocoderCache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LocationResolverService
{
    /**
     * Resolve latitude and longitude into administrative division, district, upazila, and street address.
     */
    public function resolve(float $latitude, float $longitude): array
    {
        // 1. Boundary check: Bangladesh bounds roughly Lat: 20.5 to 26.8, Lng: 88.0 to 92.8
        if ($latitude < 20.3 || $latitude > 27.0 || $longitude < 87.8 || $longitude > 93.0) {
            return [
                'success' => false,
                'message' => 'Coordinates are outside Bangladesh territory.',
                'in_bangladesh' => false,
            ];
        }

        // 2. Spatial Query against admin_boundaries
        $pointWkt = sprintf('POINT(%F %F)', $longitude, $latitude);

        $divisions = AdminBoundary::where('admin_level', 1)
            ->where('min_lat', '<=', $latitude)
            ->where('max_lat', '>=', $latitude)
            ->where('min_lng', '<=', $longitude)
            ->where('max_lng', '>=', $longitude)
            ->whereRaw('ST_Contains(boundary, ST_SRID(ST_GeomFromText(?), 4326))', [$pointWkt])
            ->first();

        // 3. Reverse Geocode with Caching & Rate Limiting (Nominatim OSM)
        $osmData = $this->reverseGeocode($latitude, $longitude);

        // 4. Map OSM components to known districts and divisions
        $divisionId = null;
        $districtId = null;
        $upazilaId = null;
        $road = null;
        $area = null;
        $postcode = null;
        $displayName = null;

        if ($osmData && isset($osmData['address'])) {
            $addr = $osmData['address'];
            $road = $addr['road'] ?? $addr['pedestrian'] ?? $addr['street'] ?? null;
            $area = $addr['suburb'] ?? $addr['neighbourhood'] ?? $addr['residential'] ?? $addr['village'] ?? null;
            $postcode = $addr['postcode'] ?? null;
            $displayName = $osmData['display_name'] ?? null;

            // Map OSM state to Division
            $state = $addr['state'] ?? '';
            $divisionId = $this->matchDivision($state);

            // Map OSM county / city / district to District
            $county = $addr['county'] ?? $addr['city'] ?? $addr['state_district'] ?? '';
            $districtId = $this->matchDistrict($county, $divisionId);

            // Map OSM upazila / subdistrict
            $subdistrict = $addr['subdistrict'] ?? $addr['borough'] ?? $area ?? '';
            $upazilaId = $this->matchUpazila($subdistrict, $districtId);
        }

        // Fallback to spatial boundary division if OSM didn't supply it
        if (!$divisionId && $divisions) {
            $divisionId = $divisions->code;
        }

        // If district not found but division known, find nearest or first district in division
        if (!$districtId && $divisionId) {
            $firstDist = AdminBoundary::where('admin_level', 2)
                ->whereHas('parent', fn ($q) => $q->where('code', $divisionId))
                ->first();
            if ($firstDist) {
                $districtId = $firstDist->code;
            }
        }

        return [
            'success' => true,
            'in_bangladesh' => true,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'division_id' => $divisionId,
            'district_id' => $districtId,
            'upazila_id' => $upazilaId,
            'road' => $road,
            'area' => $area,
            'postcode' => $postcode,
            'detected_address' => $displayName ?: $this->fallbackAddress($divisionId, $districtId, $upazilaId),
            'provider' => 'osm_openfreemap',
        ];
    }

    /**
     * Rate-limited & cached Nominatim reverse geocode.
     */
    protected function reverseGeocode(float $lat, float $lng): ?array
    {
        $hash = md5(sprintf('%.5f:%.5f', $lat, $lng));
        $cacheEnabled = config('map.geocoder_cache_enabled', true);
        $ttlSeconds = config('map.geocoder_cache_ttl', 2592000);

        // Check local cache in database
        if ($cacheEnabled) {
            $cached = GeocoderCache::where('query_hash', $hash)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->first();

            if ($cached) {
                return $cached->response_json;
            }
        }

        // Respect OpenStreetMap Nominatim rate limit (default 1 req/sec)
        $rateLimit = config('map.nominatim_rate_limit', 1.0);
        $minInterval = $rateLimit > 0 ? (1.0 / $rateLimit) : 1.0;
        $lastRequestTime = Cache::get('nominatim_last_request_timestamp', 0);
        $now = microtime(true);
        if ($now - $lastRequestTime < $minInterval) {
            usleep((int) (($minInterval - ($now - $lastRequestTime)) * 1000000));
        }
        Cache::put('nominatim_last_request_timestamp', microtime(true), 60);

        try {
            $userAgent = config('map.nominatim_user_agent', 'TruthHubBD/1.0');
            $contactEmail = config('map.nominatim_contact_email', 'truthhubbd64@gmail.com');
            $fullUserAgent = $contactEmail ? "{$userAgent} (contact: {$contactEmail})" : $userAgent;

            $baseUrl = rtrim(config('map.nominatim_base_url', 'https://nominatim.openstreetmap.org'), '/');

            $response = Http::withHeaders([
                'User-Agent' => $fullUserAgent,
                'Accept' => 'application/json',
            ])
            ->timeout(3)
            ->get("{$baseUrl}/reverse", [
                'format' => 'jsonv2',
                'lat' => $lat,
                'lon' => $lng,
                'zoom' => 18,
                'addressdetails' => 1,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($cacheEnabled) {
                    GeocoderCache::updateOrCreate(
                        ['query_hash' => $hash],
                        [
                            'latitude' => $lat,
                            'longitude' => $lng,
                            'provider' => config('map.geocoder_provider', 'nominatim'),
                            'response_json' => $data,
                            'expires_at' => now()->addSeconds($ttlSeconds),
                        ]
                    );
                }
                return $data;
            }
        } catch (\Throwable $e) {
            Log::warning('Nominatim reverse geocode warning: ' . $e->getMessage());
        }

        return null;
    }

    protected function matchDivision(string $name): ?string
    {
        $clean = mb_strtolower(trim($name));
        $clean = str_replace(['division', 'বিভাগ'], '', $clean);
        $clean = trim($clean);

        $map = [
            'dhaka' => 'dhaka', 'ঢাকা' => 'dhaka',
            'chittagong' => 'chittagong', 'chattogram' => 'chittagong', 'চট্টগ্রাম' => 'chittagong',
            'rajshahi' => 'rajshahi', 'রাজশাহী' => 'rajshahi',
            'khulna' => 'khulna', 'খুলনা' => 'khulna',
            'barisal' => 'barisal', 'barishal' => 'barisal', 'বরিশাল' => 'barisal',
            'sylhet' => 'sylhet', 'সিলেট' => 'sylhet',
            'rangpur' => 'rangpur', 'রংপুর' => 'rangpur',
            'mymensingh' => 'mymensingh', 'ময়মনসিংহ' => 'mymensingh',
        ];

        return $map[$clean] ?? null;
    }

    protected function matchDistrict(string $name, ?string $divisionId): ?string
    {
        $clean = mb_strtolower(trim($name));
        $clean = str_replace(['district', 'জেলা', 'zila'], '', $clean);
        $clean = trim($clean);

        $query = AdminBoundary::where('admin_level', 2);
        if ($divisionId) {
            $query->whereHas('parent', fn ($q) => $q->where('code', $divisionId));
        }

        $all = $query->get();
        foreach ($all as $d) {
            if (mb_strtolower($d->name_en) === $clean || mb_strtolower($d->name_bn) === $clean || str_contains($clean, mb_strtolower($d->name_en))) {
                return $d->code;
            }
        }

        return null;
    }

    protected function matchUpazila(string $name, ?string $districtId): ?string
    {
        $clean = mb_strtolower(trim($name));
        $clean = str_replace(['upazila', 'উপজেলা', 'thana', 'থানা'], '', $clean);
        $clean = trim($clean);

        if (!$clean) return null;

        $query = AdminBoundary::where('admin_level', 3);
        if ($districtId) {
            $query->whereHas('parent', fn ($q) => $q->where('code', $districtId));
        }

        $all = $query->get();
        foreach ($all as $u) {
            if (mb_strtolower($u->name_en) === $clean || mb_strtolower($u->name_bn) === $clean || str_contains($clean, mb_strtolower($u->name_en))) {
                return $u->code;
            }
        }

        return null;
    }

    protected function fallbackAddress(?string $div, ?string $dist, ?string $upz): string
    {
        $parts = array_filter([$upz, $dist, $div, 'Bangladesh']);
        return implode(', ', array_map('ucwords', $parts));
    }

    /**
     * Search an area, neighborhood, sector, or address within Bangladesh.
     */
    public function search(string $query): array
    {
        $q = trim($query);
        if (mb_strlen($q) < 2) {
            return [];
        }

        $results = [];

        // 1. Search admin boundaries first (Divisions, Districts, Upazilas)
        $boundaries = AdminBoundary::where(function ($b) use ($q) {
            $b->where('name_en', 'like', "%{$q}%")
              ->orWhere('name_bn', 'like', "%{$q}%");
        })
        ->limit(6)
        ->get();

        foreach ($boundaries as $b) {
            $divCode = $b->admin_level === 1 ? $b->code : ($b->parent?->admin_level === 1 ? $b->parent->code : null);
            $distCode = $b->admin_level === 2 ? $b->code : ($b->parent?->admin_level === 2 ? $b->parent->code : null);
            $upzCode = $b->admin_level === 3 ? $b->code : null;

            $results[] = [
                'id' => 'admin_' . $b->id,
                'name' => $b->name_en,
                'name_bn' => $b->name_bn,
                'type' => $b->admin_level === 1 ? 'division' : ($b->admin_level === 2 ? 'district' : 'upazila'),
                'display_name' => $b->name_en . ($b->parent ? ', ' . $b->parent->name_en : '') . ', Bangladesh',
                'lat' => (float) (($b->min_lat + $b->max_lat) / 2),
                'lng' => (float) (($b->min_lng + $b->max_lng) / 2),
                'division_id' => $divCode,
                'district_id' => $distCode,
                'upazila_id' => $upzCode,
                'street' => '',
            ];
        }

        // 2. Query OSM Nominatim Search in Bangladesh (cached in database)
        $hash = 'search_' . md5(mb_strtolower($q));
        $cached = GeocoderCache::where('query_hash', $hash)
            ->where(function ($c) {
                $c->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        $nominatimResults = [];
        if ($cached) {
            $nominatimResults = $cached->response_json;
        } else {
            $rateLimit = config('map.nominatim_rate_limit', 1.0);
            $minInterval = $rateLimit > 0 ? (1.0 / $rateLimit) : 1.0;
            $lastRequestTime = Cache::get('nominatim_last_request_timestamp', 0);
            $now = microtime(true);
            if ($now - $lastRequestTime < $minInterval) {
                usleep((int) (($minInterval - ($now - $lastRequestTime)) * 1000000));
            }
            Cache::put('nominatim_last_request_timestamp', microtime(true), 60);

            try {
                $userAgent = config('map.nominatim_user_agent', 'TruthHubBD/1.0');
                $contactEmail = config('map.nominatim_contact_email', 'truthhubbd64@gmail.com');
                $fullUserAgent = $contactEmail ? "{$userAgent} (contact: {$contactEmail})" : $userAgent;
                $baseUrl = rtrim(config('map.nominatim_base_url', 'https://nominatim.openstreetmap.org'), '/');

                $resp = Http::withHeaders([
                    'User-Agent' => $fullUserAgent,
                    'Accept' => 'application/json',
                ])
                ->timeout(4)
                ->get("{$baseUrl}/search", [
                    'q' => $q,
                    'countrycodes' => 'bd',
                    'format' => 'jsonv2',
                    'addressdetails' => 1,
                    'limit' => 6,
                ]);

                if ($resp->successful()) {
                    $nominatimResults = $resp->json();
                    GeocoderCache::updateOrCreate(
                        ['query_hash' => $hash],
                        [
                            'latitude' => 0,
                            'longitude' => 0,
                            'provider' => 'nominatim_search',
                            'response_json' => $nominatimResults,
                            'expires_at' => now()->addDays(30),
                        ]
                    );
                }
            } catch (\Throwable $e) {
                Log::warning('Nominatim search warning: ' . $e->getMessage());
            }
        }

        foreach ($nominatimResults as $nr) {
            $lat = (float) ($nr['lat'] ?? 0);
            $lng = (float) ($nr['lon'] ?? 0);
            if ($lat === 0.0 || $lng === 0.0) continue;

            $addr = $nr['address'] ?? [];
            $state = $addr['state'] ?? '';
            $county = $addr['county'] ?? $addr['city'] ?? $addr['state_district'] ?? '';
            $subdistrict = $addr['subdistrict'] ?? $addr['borough'] ?? $addr['suburb'] ?? '';

            $divCode = $this->matchDivision($state);
            $distCode = $this->matchDistrict($county, $divCode);
            $upzCode = $this->matchUpazila($subdistrict, $distCode);

            $road = $addr['road'] ?? $addr['street'] ?? $addr['pedestrian'] ?? null;
            $area = $addr['suburb'] ?? $addr['neighbourhood'] ?? $addr['residential'] ?? null;
            $street = implode(', ', array_filter([$road, $area]));

            $results[] = [
                'id' => 'osm_' . ($nr['place_id'] ?? uniqid()),
                'name' => $nr['name'] ?? $road ?? $area ?? $nr['display_name'],
                'name_bn' => $nr['name'] ?? $nr['display_name'],
                'display_name' => $nr['display_name'],
                'type' => $nr['type'] ?? 'place',
                'lat' => $lat,
                'lng' => $lng,
                'division_id' => $divCode,
                'district_id' => $distCode,
                'upazila_id' => $upzCode,
                'street' => $street ?: $nr['display_name'],
            ];
        }

        return $results;
    }
}
