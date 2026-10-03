<?php

return [
    'map_provider' => env('MAP_PROVIDER', 'openfreemap'),
    'map_style_url' => env('MAP_STYLE_URL', 'https://tiles.openfreemap.org/styles/liberty'),
    'default_lat' => (float) env('MAP_DEFAULT_LAT', 23.6850),
    'default_lng' => (float) env('MAP_DEFAULT_LNG', 90.3563),
    'default_zoom' => (int) env('MAP_DEFAULT_ZOOM', 6),

    'geocoder_provider' => env('GEOCODER_PROVIDER', 'nominatim'),
    'nominatim_base_url' => env('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org'),
    'nominatim_user_agent' => env('NOMINATIM_USER_AGENT', 'TruthHubBD/1.0'),
    'nominatim_contact_email' => env('NOMINATIM_CONTACT_EMAIL', 'truthhubbd64@gmail.com'),
    'nominatim_rate_limit' => (float) env('NOMINATIM_RATE_LIMIT', 1.0),

    'geocoder_cache_enabled' => env('GEOCODER_CACHE_ENABLED', true),
    'geocoder_cache_ttl' => (int) env('GEOCODER_CACHE_TTL', 2592000), // 30 days in seconds
];
