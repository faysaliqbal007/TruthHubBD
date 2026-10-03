<?php

namespace App\Support;

final class AdvertisementDestination
{
    /** Syntax-only public link validation. Never fetches, proxies, or verifies the destination. */
    public static function normalize(mixed $value): ?string
    {
        if (!is_string($value) || strlen($value)>2048 || $value!==trim($value) || str_contains($value,'\\')
            || preg_match('/[\x00-\x20\x7f]/',$value) || preg_match('/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i',$value)
            || !filter_var($value,FILTER_VALIDATE_URL)) return null;
        $parts = parse_url($value);
        if (!$parts || strtolower($parts['scheme']??'')!=='https' || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])) return null;
        $host = strtolower($parts['host']??'');
        if (filter_var($host,FILTER_VALIDATE_IP) || !preg_match('/\A(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\z/',$host)) return null;
        foreach (['localhost','local','internal','test','invalid','example','onion','lan','home','arpa'] as $suffix) {
            if ($host===$suffix || str_ends_with($host,'.'.$suffix)) return null;
        }
        return 'https://'.$host.($parts['path']??'/').(isset($parts['query'])?'?'.$parts['query']:'').(isset($parts['fragment'])?'#'.$parts['fragment']:'');
    }
}
