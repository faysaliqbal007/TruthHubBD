<?php

namespace App\Support;

final class OsmDirectoryFacts
{
    public static function sourceReference(array $element): ?string
    {
        $type = $element['type'] ?? null;
        $id = $element['id'] ?? null;
        if (!in_array($type, ['node', 'way', 'relation'], true) || !is_scalar($id) || !preg_match('/\A[1-9][0-9]*\z/', (string) $id)) return null;
        return 'osm:'.$type.':'.$id;
    }

    public static function coordinates(array $element): ?array
    {
        $latitude = $element['lat'] ?? $element['center']['lat'] ?? null;
        $longitude = $element['lon'] ?? $element['center']['lon'] ?? null;
        if (!is_numeric($latitude) || !is_numeric($longitude) || $latitude < 20.5 || $latitude > 26.7 || $longitude < 88 || $longitude > 92.8) return null;
        return [$latitude, $longitude];
    }

    public static function address(array $tags): string
    {
        $parts = [];
        foreach (['addr:full', 'addr:housenumber', 'addr:street', 'addr:suburb', 'addr:city', 'addr:district', 'addr:province', 'addr:state'] as $field) {
            if (is_scalar($tags[$field] ?? null) && trim((string) $tags[$field])) $parts[] = trim((string) $tags[$field]);
        }
        $parts[] = 'Bangladesh'; // The bounded import explicitly queries the Bangladesh country area.
        return implode(', ', array_unique($parts));
    }
}
