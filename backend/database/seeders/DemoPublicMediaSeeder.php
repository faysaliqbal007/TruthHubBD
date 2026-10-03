<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoPublicMediaSeeder extends Seeder
{
    private const LEGACY_TITLE = 'Clear communication and a helpful team';
    private const LEGACY_BODY = 'Demonstration review: the team explained the process clearly and answered my questions. This is sample content, not a real customer experience.';
    private const STORIES = [
        [
            'Warranty terms explained before purchase',
            'Demonstration review: the example electronics team explained the warranty period, receipt requirements and the steps for requesting support. I could compare the terms before choosing an item. This is fictional sample content, not a real customer experience.',
            'কেনার আগে ওয়ারেন্টির শর্ত পরিষ্কারভাবে জানানো হয়েছে',
            'ডেমো রিভিউ: উদাহরণের ইলেকট্রনিকস দলটি ওয়ারেন্টির মেয়াদ, রসিদের প্রয়োজনীয়তা এবং সহায়তা চাওয়ার ধাপগুলো ব্যাখ্যা করেছে। পণ্য বেছে নেওয়ার আগে শর্তগুলো তুলনা করতে পেরেছি। এটি কাল্পনিক নমুনা তথ্য, কোনো প্রকৃত গ্রাহকের অভিজ্ঞতা নয়।',
        ],
        [
            'A clear explanation of the waiting process',
            'Demonstration review: the example clinic described the expected wait and how appointment updates would be shared. Clear information helped me plan the visit without treating an estimate as a guarantee. This is fictional sample content, not a real patient experience.',
            'অপেক্ষার প্রক্রিয়া সম্পর্কে পরিষ্কার ধারণা',
            'ডেমো রিভিউ: উদাহরণের ক্লিনিকটি সম্ভাব্য অপেক্ষার সময় এবং অ্যাপয়েন্টমেন্টের আপডেট কীভাবে জানানো হবে তা ব্যাখ্যা করেছে। আনুমানিক সময়কে নিশ্চয়তা ধরে না নিয়ে এই তথ্যের সাহায্যে ভিজিটের পরিকল্পনা করতে পেরেছি। এটি কাল্পনিক নমুনা তথ্য, কোনো প্রকৃত রোগীর অভিজ্ঞতা নয়।',
        ],
        [
            'Course fees and schedules were easy to compare',
            'Demonstration review: the example learning center separated tuition fees from optional costs and showed the class schedule before enrollment. The written outline made it easier to compare the offer and ask questions. This is fictional sample content, not a real student experience.',
            'কোর্সের ফি ও সময়সূচি তুলনা করা সহজ হয়েছে',
            'ডেমো রিভিউ: উদাহরণের শিক্ষা প্রতিষ্ঠানটি ভর্তির আগে টিউশন ফি থেকে ঐচ্ছিক খরচ আলাদা করে দেখিয়েছে এবং ক্লাসের সময়সূচি জানিয়েছে। লিখিত বিবরণ দেখে প্রস্তাবটি তুলনা করা ও প্রশ্ন করা সহজ হয়েছে। এটি কাল্পনিক নমুনা তথ্য, কোনো প্রকৃত শিক্ষার্থীর অভিজ্ঞতা নয়।',
        ],
        [
            'Tracking updates made the delivery steps clear',
            'Demonstration review: the example parcel service provided a tracking reference and explained what each delivery status meant. A simple sequence of updates helped me understand when to expect another message. This is fictional sample content, not a real delivery experience.',
            'ট্র্যাকিং আপডেটে ডেলিভারির ধাপগুলো পরিষ্কার হয়েছে',
            'ডেমো রিভিউ: উদাহরণের পার্সেল সেবাটি একটি ট্র্যাকিং রেফারেন্স দিয়েছে এবং ডেলিভারির প্রতিটি অবস্থার অর্থ ব্যাখ্যা করেছে। ধারাবাহিক আপডেট থেকে পরবর্তী বার্তা কখন আশা করতে পারি তা বুঝতে পেরেছি। এটি কাল্পনিক নমুনা তথ্য, কোনো প্রকৃত ডেলিভারির অভিজ্ঞতা নয়।',
        ],
    ];

    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) throw new \RuntimeException('Demo media may only run in local/testing environments.');
        $fixtures = [
            ['demo-northline-electronics', 'Demo Northline Electronics', 'delivery', 'Fictional delivery illustration'],
            ['demo-riverstone-clinic', 'Demo Riverstone Clinic', 'receipt', 'Fictional receipt illustration'],
            ['demo-learning-house', 'Demo Learning House', 'service', 'Fictional service illustration'],
            ['demo-parcel-path', 'Demo Parcel Path', 'parcel', 'Fictional parcel illustration'],
        ];
        $participant = User::where('email', 'preview@example.test')->first();
        foreach ($fixtures as $index => [$slug, $name, $image, $alt]) {
            // Never create records or attach illustrations to real community reports.
            $business = Business::where('slug', $slug)->where('name', $name)
                ->where('description', 'like', 'Fictional demo listing for exploring TruthHubBD.%')->first();
            if (!$business) continue;
            $business->update(['is_demo' => true]);
            $gallery = match ($index) {
                0 => [$image],
                1 => [],
                2 => [$image, 'receipt', 'delivery'],
                3 => [$image, 'delivery', 'receipt', 'service'],
            };
            $media = array_map(fn ($asset) => ['url' => '/demo-media/'.$asset.'.svg', 'alt' => 'Fictional '.$asset.' illustration', 'kind' => 'illustration', 'caption' => 'Fictional demo illustration. Not submitted evidence.', 'approved_for_public' => true], $gallery);
            [$title, $body, $titleBn, $bodyBn] = self::STORIES[$index];
            $reviews = Review::where('business_id', $business->id)->where('author', 'Demo Reviewer')
                ->where('user_id', $participant?->id ?? -1)->where('is_demo', true)
                ->whereIn('title', [self::LEGACY_TITLE, $title])->whereIn('body', [self::LEGACY_BODY, $body])->get();
            foreach ($reviews as $review) {
                $review->update(['title' => $title, 'body' => $body, 'public_media' => $media, 'translations' => [
                    'en' => ['approved_for_public' => true, 'title' => $title, 'body' => $body],
                    'bn' => ['approved_for_public' => true, 'title' => $titleBn, 'body' => $bodyBn],
                ]]);
                \App\Support\DemoDiscussion::seed($review);
            }
            $case = ScamCase::where('business_id', $business->id)->where('case_code', 'DEMO-2026-'.($index + 1))
                ->where('title', 'Fictional demonstration case')->first();
            if ($case) $case->update(['is_demo' => true, 'public_media' => $media, 'translations' => [
                'en' => ['approved_for_public' => true, 'title' => 'Case concerning '.$business->name, 'summary' => $case->public_summary],
                'bn' => ['approved_for_public' => true, 'title' => $business->name.' সম্পর্কিত ডেমো কেস', 'summary' => [
                    'কাল্পনিক ডেমো: পর্যালোচনার পর ডেলিভারি-সংক্রান্ত অভিযোগটি উদাহরণ প্ল্যাটফর্মের প্রকাশের মানদণ্ড পূরণ করেছে।',
                    'কাল্পনিক ডেমো: টাকা ফেরত নিয়ে বিরোধের সমাধান হয়েছে। কেসের ইতিহাস দেখা যায়।',
                    'কাল্পনিক ডেমো: সংশ্লিষ্ট প্রতিষ্ঠান উত্তর দিয়েছে এবং কেসের সিদ্ধান্ত নিয়ে আপত্তি রয়েছে।',
                ][$index]],
            ]]);
        }
    }
}
