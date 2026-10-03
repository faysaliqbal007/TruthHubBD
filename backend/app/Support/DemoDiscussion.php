<?php

namespace App\Support;

use App\Models\{Review, User};
use Illuminate\Support\Facades\DB;

final class DemoDiscussion
{
    private const MESSAGES = [
        ['Fictional demo discussion: What details made the process easy to understand? This conversation is sample content.', 'কাল্পনিক ডেমো আলোচনা: কোন বিষয়গুলো প্রক্রিয়াটি বুঝতে সহজ করেছে? এই কথোপকথনটি নমুনা তথ্য।'],
        ['Fictional demo discussion: A clear timeline and courteous updates would be helpful in this example.', 'কাল্পনিক ডেমো আলোচনা: এই উদাহরণে একটি স্পষ্ট সময়সূচি ও সৌজন্যপূর্ণ আপডেট সহায়ক হতে পারে।'],
        ['Fictional demo reply: In this example, the team explained each step. This is not a real customer conversation.', 'কাল্পনিক ডেমো উত্তর: এই উদাহরণে দলটি প্রতিটি ধাপ ব্যাখ্যা করেছে। এটি কোনো প্রকৃত গ্রাহকের কথোপকথন নয়।'],
    ];

    public static function seed(Review $review): void
    {
        if (!$review->is_demo) return;
        $participant = User::where('email', 'preview@example.test')->whereKey($review->user_id)->first();
        if (!$participant) return;
        $first = null;
        foreach (self::MESSAGES as $index => [$body]) {
            $parent = $index === 2 ? $first : null;
            $existing = DB::table('review_comments')->where('review_id', $review->id)->where('user_id', $participant->id)
                ->where('body', $body)->where('parent_id', $parent)->first();
            $id = $existing?->id ?? DB::table('review_comments')->insertGetId(['review_id' => $review->id,
                'user_id' => $participant->id, 'body' => $body, 'parent_id' => $parent, 'status' => 'published',
                'created_at' => now(), 'updated_at' => now()]);
            if ($index === 0) $first = $id;
        }
    }

    /** Code-reviewed fictional translations only; callers also check demo record/participant identity. */
    public static function translations(string $body): array
    {
        foreach (self::MESSAGES as [$english, $bangla]) {
            if ($body === $english) return ['en' => ['body' => $english], 'bn' => ['body' => $bangla]];
        }
        return [];
    }
}
