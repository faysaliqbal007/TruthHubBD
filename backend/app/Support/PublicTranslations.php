<?php

namespace App\Support;

final class PublicTranslations
{
    public static function visible(mixed $stored, array $fields): array
    {
        if (is_string($stored)) $stored = json_decode($stored, true);
        if (!is_array($stored)) return [];
        $visible = [];
        foreach (['en', 'bn'] as $lang) {
            $entry = $stored[$lang] ?? null;
            if (!is_array($entry) || ($entry['approved_for_public'] ?? false) !== true) continue;
            $translation = [];
            foreach ($fields as $field) {
                if (is_string($entry[$field] ?? null) && trim($entry[$field]) && mb_strlen($entry[$field]) <= 10000) $translation[$field] = $entry[$field];
            }
            if ($translation) $visible[$lang] = $translation;
        }
        return $visible;
    }
}
