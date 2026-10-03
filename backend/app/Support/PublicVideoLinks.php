<?php

namespace App\Support;

final class PublicVideoLinks
{
    /** URL syntax only. We never request a URL or verify anonymous accessibility. */
    public static function normalize(mixed $url): ?string
    {
        if (!is_string($url) || strlen($url) > 2048 || $url !== trim($url)
            || str_contains($url, '\\') || preg_match('/[\x00-\x20\x7f]/', $url) || preg_match('/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i', $url)) return null;
        if (!filter_var($url, FILTER_VALIDATE_URL)) return null;
        $parts = parse_url($url);
        if (!$parts || strtolower($parts['scheme'] ?? '') !== 'https' || isset($parts['user'])
            || isset($parts['pass']) || isset($parts['port']) || isset($parts['fragment'])) return null;
        $host = strtolower($parts['host'] ?? '');
        $path = $parts['path'] ?? '/';
        parse_str($parts['query'] ?? '', $query);
        if (in_array($host, ['youtube.com', 'www.youtube.com', 'm.youtube.com'], true)) {
            $id = $path === '/watch' ? ($query['v'] ?? null) : null;
            if (preg_match('~\A/(?:shorts|live|embed)/([A-Za-z0-9_-]{11})/?\z~', $path, $match)) $id = $match[1];
            return is_string($id) && preg_match('/\A[A-Za-z0-9_-]{11}\z/', $id) ? 'https://www.youtube.com/watch?v='.$id : null;
        }
        if ($host === 'youtu.be' && preg_match('~\A/([A-Za-z0-9_-]{11})/?\z~', $path, $match)) return 'https://www.youtube.com/watch?v='.$match[1];
        if (in_array($host, ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'], true)
            && preg_match('~\A/(?:video/)?([0-9]{1,20})/?\z~', $path, $match)) return 'https://vimeo.com/'.$match[1];
        if (in_array($host, ['facebook.com', 'www.facebook.com', 'm.facebook.com'], true)) {
            if (preg_match('~\A/(?:[^/]+/videos|reel)/([0-9]{1,30})/?\z~', $path, $match)) return 'https://www.facebook.com/watch/?v='.$match[1];
            $id = $query['v'] ?? null;
            if (in_array($path, ['/watch', '/watch/'], true) && is_string($id) && preg_match('/\A[0-9]{1,30}\z/', $id)) return 'https://www.facebook.com/watch/?v='.$id;
        }
        if (in_array($host, ['tiktok.com', 'www.tiktok.com'], true)
            && preg_match('~\A/@([A-Za-z0-9_.]{1,64})/video/([0-9]{1,30})/?\z~', $path, $match)) return 'https://www.tiktok.com/@'.$match[1].'/video/'.$match[2];
        if (in_array($host, ['dailymotion.com', 'www.dailymotion.com'], true)
            && preg_match('~\A/video/([A-Za-z0-9]{1,30})/?\z~', $path, $match)) return 'https://www.dailymotion.com/video/'.$match[1];
        if ($host === 'dai.ly' && preg_match('~\A/([A-Za-z0-9]{1,30})/?\z~', $path, $match)) return 'https://www.dailymotion.com/video/'.$match[1];
        return null;
    }

    public static function rules(): array
    {
        return [
            'public_video_urls' => 'nullable|array|max:3',
            'public_video_urls.*' => ['required', 'string', 'max:2048', function ($attribute, $value, $fail) {
                if (self::normalize($value) === null) $fail('Use an HTTPS video link from YouTube, Vimeo, Facebook, TikTok or Dailymotion, without credentials or a private host.');
            }],
            'public_video_consent' => 'sometimes|boolean',
        ];
    }

    public static function visible(mixed $stored): array
    {
        if (is_string($stored)) $stored = json_decode($stored, true);
        if (!is_array($stored)) return [];
        return array_values(array_unique(array_filter(array_map([self::class, 'normalize'], array_slice($stored, 0, 3)))));
    }
}
