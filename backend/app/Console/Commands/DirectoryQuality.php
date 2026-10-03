<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Support\BangladeshDivisions;
use Illuminate\Console\Command;

class DirectoryQuality extends Command
{
    protected $signature = 'directory:quality';
    protected $description = 'Read-only offline audit of OSM source references, recorded addresses and coordinate completeness';

    public function handle(): int
    {
        $metrics = ['imported_count' => 0, 'country_only_address_count' => 0, 'unknown_division_count' => 0,
            'missing_coordinates_count' => 0, 'outside_import_bounds_count' => 0, 'invalid_source_ref_count' => 0,
            'source_link_mismatch_count' => 0, 'missing_fetched_at_count' => 0, 'unverified_ownership_count' => 0];
        $categories = [];
        foreach (Business::publicDirectory()->where('source_ref','like','osm:%')->cursor() as $business) {
            $metrics['imported_count']++;
            $categories[$business->category] = ($categories[$business->category] ?? 0) + 1;
            if (!trim($business->location ?? '') || preg_match('/^(?:Bangladesh|বাংলাদেশ)$/iu', trim($business->location))) $metrics['country_only_address_count']++;
            if (!BangladeshDivisions::fromLocation($business->location)) $metrics['unknown_division_count']++;
            if (!is_numeric($business->latitude) || !is_numeric($business->longitude)) $metrics['missing_coordinates_count']++;
            elseif ($business->latitude < 20.5 || $business->latitude > 26.7 || $business->longitude < 88 || $business->longitude > 92.8) $metrics['outside_import_bounds_count']++;
            if (!preg_match('/\Aosm:(node|way|relation):([1-9][0-9]*)\z/', $business->source_ref, $source)) $metrics['invalid_source_ref_count']++;
            elseif ($business->source_url !== 'https://www.openstreetmap.org/'.$source[1].'/'.$source[2]) $metrics['source_link_mismatch_count']++;
            if (!$business->source_fetched_at) $metrics['missing_fetched_at_count']++;
            if (!$business->verified) $metrics['unverified_ownership_count']++;
        }
        $this->line(json_encode(['checked_at' => now()->toIso8601String(), 'source' => 'OpenStreetMap', 'metrics' => $metrics, 'categories' => $categories,
            'note' => 'Read-only audit of stored source metadata. No network collection, reverse geocoding, record changes or independent verification. Source centers can differ from entrances; bounding-box inclusion does not prove a precise address or operating status.'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return self::SUCCESS;
    }
}
