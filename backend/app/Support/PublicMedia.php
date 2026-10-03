<?php

namespace App\Support;

final class PublicMedia
{
    public const SAMPLE_SHOP_ILLUSTRATION = '/demo-media/community-shop-ai-v1.png';
    private const DEMO_IMAGES = ['/demo-media/delivery.svg', '/demo-media/parcel.svg', '/demo-media/receipt.svg', '/demo-media/service.svg', self::SAMPLE_SHOP_ILLUSTRATION];

    /** Only explicit public copies may leave the server; approval details stay internal. */
    public static function visible(mixed $stored, bool $isDemo = false): array
    {
        if (is_string($stored)) $stored = json_decode($stored, true);
        if (!is_array($stored)) return [];
        $visible = [];
        foreach (array_slice($stored, 0, 20) as $item) {
            if (!is_array($item) || ($item['approved_for_public'] ?? false) !== true) continue;
            $url = $item['url'] ?? null;
            $alt = $item['alt'] ?? null;
            $kind = $item['kind'] ?? null;
            if (!is_string($url) || !is_string($alt) || !trim($alt) || mb_strlen($alt) > 300) continue;
            if ($kind === 'illustration') {
                if (!$isDemo || !in_array($url, self::DEMO_IMAGES, true)) continue;
            } elseif ($kind === 'photo') {
                if (($item['consent_confirmed'] ?? false) !== true || ($item['redacted'] ?? false) !== true) continue;
                // No private storage, traversal, remote tracking URLs, query strings, or active SVGs.
                if (!preg_match('~\A/(?:public-media|storage/scam-media)/[a-z0-9][a-z0-9_.-]*\.(?:jpg|jpeg|png|webp)\z~i', $url)) continue;
            } else continue;
            $public = ['url' => $url, 'alt' => trim($alt), 'kind' => $kind];
            if (is_string($item['caption'] ?? null) && mb_strlen($item['caption']) <= 500) $public['caption'] = $item['caption'];
            $visible[] = $public;
        }
        return $visible;
    }
}
