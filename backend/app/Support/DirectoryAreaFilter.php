<?php
namespace App\Support;

final class DirectoryAreaFilter
{
    public static function apply($query, string $area): void
    {
        if (!$area || preg_match('/all bangladesh|সারাদেশ/iu', $area)) return;
        if (preg_match('/^(.+?)\s+division$/iu', trim($area), $match)) {
            $key = mb_strtolower(trim($match[1]));
            $key = ['chittagong' => 'chattogram', 'barisal' => 'barishal'][$key] ?? $key;
            if (isset(BangladeshDivisions::ALL[$key])) {
                // The ledger and its navigation must agree, including ambiguous/unknown addresses.
                $locations = \App\Models\Business::query()->whereNotNull('location')->distinct()->pluck('location')
                    ->filter(fn ($location) => BangladeshDivisions::fromLocation($location) === $key)->values()->all();
                $query->whereIn('location', $locations);
                return;
            }
        }
        $area = preg_replace('/\b(entire|district|division)\b|\(all upazilas\)|বিভাগ/iu', '', $area);
        foreach (array_filter(array_map('trim', preg_split('/[,\/]+/u', mb_strtolower($area)))) as $part) {
            if (in_array($part, ['bangladesh', 'বাংলাদেশ'], true)) continue;
            $query->whereRaw('LOWER(location) LIKE ?', ['%'.$part.'%']);
        }
    }
}
