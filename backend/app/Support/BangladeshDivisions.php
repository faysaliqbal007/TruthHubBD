<?php

namespace App\Support;

final class BangladeshDivisions
{
    public const ALL = [
        'dhaka' => ['Dhaka', 'ঢাকা', 'dhaka'],
        'chattogram' => ['Chattogram', 'চট্টগ্রাম', 'chittagong'],
        'rajshahi' => ['Rajshahi', 'রাজশাহী', 'rajshahi'],
        'khulna' => ['Khulna', 'খুলনা', 'khulna'],
        'barishal' => ['Barishal', 'বরিশাল', 'barisal'],
        'sylhet' => ['Sylhet', 'সিলেট', 'sylhet'],
        'rangpur' => ['Rangpur', 'রংপুর', 'rangpur'],
        'mymensingh' => ['Mymensingh', 'ময়মনসিংহ', 'mymensingh'],
    ];

    public static function districts(string $key): array
    {
        $group = self::ALL[$key][2] ?? $key;
        $aliases = [
            'chittagong' => ['Chattogram', 'Cumilla'],
            'barisal' => ['Barishal'],
            'khulna' => ['Jashore'],
            'rajshahi' => ['Bogra', 'Chapai Nawabganj'],
            'mymensingh' => ['Netrakona'],
        ];
        return array_merge(config('directory_areas.'.$group, []), $aliases[$group] ?? []);
    }

    /** Use recorded district/division names only; ambiguous or missing addresses stay unknown. */
    public static function fromLocation(?string $location): ?string
    {
        if (!is_string($location) || !trim($location)) return null;
        $found = [];
        foreach (self::ALL as $key => $_) {
            foreach (self::districts($key) as $district) {
                if (preg_match('/(?<![\p{L}\p{N}\p{M}])'.preg_quote($district, '/').'(?![\p{L}\p{N}\p{M}])/iu', $location)) {
                    $found[] = $key;
                    break;
                }
            }
        }
        return count($found) === 1 ? $found[0] : null;
    }
}
