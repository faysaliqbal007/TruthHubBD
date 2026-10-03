<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Models\User;
use App\Support\PublicMedia;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Optional, explicitly fictional local preview content. Never called by DatabaseSeeder. */
class SampleCommunityContentSeeder extends Seeder
{
    public const ORGANIZATION_COUNT = 8;
    public const REVIEW_COUNT = 150;
    public const CASE_COUNT = 24;

    private const DIVISIONS = [
        ['Dhaka', 'ঢাকা'], ['Chattogram', 'চট্টগ্রাম'], ['Rajshahi', 'রাজশাহী'],
        ['Khulna', 'খুলনা'], ['Barishal', 'বরিশাল'], ['Sylhet', 'সিলেট'],
        ['Rangpur', 'রংপুর'], ['Mymensingh', 'ময়মনসিংহ'],
    ];

    private const ORGANIZATIONS = [
        ['Community Shop', 'কমিউনিটি দোকান', 'Products'],
        ['Care Clinic', 'সেবা ক্লিনিক', 'Hospitals & Clinics'],
        ['Learning School', 'শিক্ষাপ্রতিষ্ঠান', 'Universities & Education'],
        ['Workplace', 'কর্মক্ষেত্র', 'Businesses & Services'],
        ['Parcel Desk', 'পার্সেল সেবা', 'Courier & Digital Services'],
        ['Community Shop', 'কমিউনিটি দোকান', 'Products'],
        ['Care Clinic', 'সেবা ক্লিনিক', 'Hospitals & Clinics'],
        ['Learning School', 'শিক্ষাপ্রতিষ্ঠান', 'Universities & Education'],
    ];

    private const STORIES = [
        ['A clear explanation of the process', 'প্রক্রিয়ার স্পষ্ট ব্যাখ্যা', 'The fictional representative described the steps and answered the sample visitor’s questions.', 'কাল্পনিক প্রতিনিধি ধাপগুলো ব্যাখ্যা করেন এবং নমুনা দর্শনার্থীর প্রশ্নের উত্তর দেন।'],
        ['Comparing information before deciding', 'সিদ্ধান্তের আগে তথ্য তুলনা', 'The example visitor compared the written information and asked for clarification before deciding.', 'নমুনা দর্শনার্থী লিখিত তথ্য তুলনা করেন এবং সিদ্ধান্তের আগে ব্যাখ্যা চান।'],
        ['An example wait for an update', 'আপডেটের জন্য নমুনা অপেক্ষা', 'In this invented scenario, the visitor waited for an update and suggested clearer communication.', 'এই কাল্পনিক পরিস্থিতিতে দর্শনার্থী আপডেটের জন্য অপেক্ষা করেন এবং স্পষ্ট যোগাযোগের পরামর্শ দেন।'],
        ['Useful details in a sample visit', 'নমুনা সফরে সহায়ক তথ্য', 'The fictional visitor received the information needed to understand the available options.', 'কাল্পনিক দর্শনার্থী উপলব্ধ বিকল্প বুঝতে প্রয়োজনীয় তথ্য পান।'],
        ['A sample follow-up question', 'নমুনা অনুসরণমূলক প্রশ্ন', 'This invented experience shows a visitor asking a follow-up question about the next step.', 'এই বানানো অভিজ্ঞতায় দর্শনার্থী পরবর্তী ধাপ সম্পর্কে আরও একটি প্রশ্ন করেন।'],
        ['Room for clearer guidance', 'আরও স্পষ্ট নির্দেশনার সুযোগ', 'The fictional visitor suggested making the example instructions easier to understand.', 'কাল্পনিক দর্শনার্থী নমুনা নির্দেশনাগুলো আরও সহজে বোঝার পরামর্শ দেন।'],
    ];

    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Sample content is limited to local/testing environments.');
        }

        DB::transaction(function (): void {
            $reviewer = User::firstOrCreate(['email' => 'sample-community-preview@example.test'], [
                'name' => 'Sample reviewer', 'role' => 'user', 'password' => null,
                'email_verified_at' => null,
            ]);
            if ($reviewer->name !== 'Sample reviewer' || $reviewer->role !== 'user' || $reviewer->email_verified_at !== null || $reviewer->getRawOriginal('password') !== null) {
                throw new \RuntimeException('Reserved sample reviewer identity is already used by another account.');
            }

            $organizations = [];
            foreach (self::DIVISIONS as $index => [$division, $divisionBn]) {
                [$kind, $kindBn, $category] = self::ORGANIZATIONS[$index];
                $slug = 'sample-community-v1-'.strtolower($division);
                $organization = Business::firstOrCreate(['slug' => $slug], [
                    'name' => 'Sample '.$division.' '.$kind.' (fictional)',
                    'bengali_name' => 'নমুনা '.$divisionBn.' '.$kindBn.' (কাল্পনিক)',
                    'category' => $category,
                    'location' => $division.' Division',
                    'description' => 'Fictional sample organization for interface previews. No real premises, customers, ownership, or allegations are represented.',
                    'is_demo' => true, 'verified' => false, 'user_id' => null,
                    'created_by_user_id' => null, 'status' => 'approved',
                    'source_ref' => null, 'source_url' => null, 'source_fetched_at' => null,
                    'latitude' => null, 'longitude' => null, 'presence' => null,
                    'phone' => null, 'website' => null, 'image' => null,
                    'rating' => 0, 'review_count' => 0,
                ]);
                if (!$organization->is_demo || $organization->verified || $organization->user_id !== null || $organization->created_by_user_id !== null || $organization->source_ref !== null || $organization->source_url !== null) {
                    throw new \RuntimeException('Reserved sample organization conflicts with a represented or source-backed profile: '.$slug);
                }
                $organizations[] = $organization;
            }

            $reviews = [];
            $previewDate = now()->startOfDay();
            for ($index = 0; $index < self::REVIEW_COUNT; $index++) {
                $organization = $organizations[$index % self::ORGANIZATION_COUNT];
                $number = str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
                [$title, $titleBn, $body, $bodyBn] = self::STORIES[$index % count(self::STORIES)];
                $date = $previewDate->copy()->subDays(intdiv($index, self::ORGANIZATION_COUNT));
                $marker = 'SAMPLE-COMMUNITY-V1-'.$number.': fictional preview, not a real experience.';
                $review = Review::firstOrCreate(['business_id' => $organization->id, 'disclaimer' => $marker], [
                    'is_demo' => true, 'user_id' => $reviewer->id,
                    'author' => 'Sample reviewer', 'initials' => 'SR',
                    'title' => 'Sample '.$number.': '.$title,
                    'body' => 'Fictional sample experience. '.$body.' This describes no real event or person.',
                    'rating' => 1 + ($index % 5), 'date' => $date->toDateString(),
                    'experience_date' => $date->copy()->subDay()->toDateString(),
                    'status' => 'published', 'verified_experience' => false,
                    'relationship_disclosure' => 'none', 'location' => $organization->location,
                    'image_path' => null, 'evidence_paths' => null, 'helpful_count' => 0,
                    'discussion_count' => 0, 'public_video_urls' => [], 'public_video_consent' => false,
                    'public_media' => $this->media($index),
                    'translations' => [
                        'en' => ['approved_for_public' => true, 'title' => 'Sample '.$number.': '.$title, 'body' => 'Fictional sample experience. '.$body.' This describes no real event or person.'],
                        'bn' => ['approved_for_public' => true, 'title' => 'নমুনা '.$number.': '.$titleBn, 'body' => 'কাল্পনিক নমুনা অভিজ্ঞতা। '.$bodyBn.' এখানে কোনো বাস্তব ঘটনা বা ব্যক্তির কথা বলা হয়নি।'],
                    ],
                ]);
                if (!$review->is_demo || $review->verified_experience || $review->user_id !== $reviewer->id) {
                    throw new \RuntimeException('Reserved sample review marker conflicts with non-sample content.');
                }
                if ($review->wasRecentlyCreated) $review->forceFill(['created_at' => $date->copy()->addHours(12)->subMinutes($index)])->save();
                $reviews[] = $review;
            }

            for ($index = 0; $index < self::CASE_COUNT; $index++) {
                $number = str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
                $status = ['published', 'resolved', 'disputed'][$index % 3];
                $summary = 'Fictional sample case '.$number.': an invented service concern demonstrates the '.$status.' platform status. No real person or organization is accused; this is not a legal finding.';
                $summaryBn = 'কাল্পনিক নমুনা কেস '.$number.': বানানো সেবাসংক্রান্ত উদ্বেগ দিয়ে প্ল্যাটফর্মের অবস্থা দেখানো হচ্ছে। কোনো বাস্তব ব্যক্তি বা প্রতিষ্ঠানের বিরুদ্ধে অভিযোগ নেই; এটি আইনি সিদ্ধান্ত নয়।';
                $case = ScamCase::firstOrCreate(['case_code' => 'SAMPLE-V1-'.$number], [
                    'business_id' => $reviews[$index]->business_id, 'review_id' => $reviews[$index]->id,
                    'reporter_user_id' => $reviewer->id, 'reviewed_by_user_id' => null,
                    'is_demo' => true, 'title' => 'Sample '.$number.': fictional service concern',
                    'summary' => 'Fictional preview only. No private evidence or documents were submitted.',
                    'public_summary' => $summary, 'amount' => null, 'status' => $status,
                    'decision_rationale' => 'Sample interface fixture only. No real allegation, evidence screening, ownership approval, or finding of guilt.',
                    'published_at' => $previewDate->copy()->subDays(intdiv($index, self::ORGANIZATION_COUNT)),
                    'resolved_at' => $status === 'resolved' ? $previewDate : null,
                    'subject_response' => $status === 'disputed' ? 'Fictional sample response. No real representative supplied this text.' : null,
                    'public_media' => $this->media($index),
                    'incoming_video_urls' => [], 'public_video_urls' => [], 'public_video_consent' => false,
                    'translations' => [
                        'en' => ['approved_for_public' => true, 'title' => 'Sample '.$number.': fictional service concern', 'summary' => $summary],
                        'bn' => ['approved_for_public' => true, 'title' => 'নমুনা '.$number.': কাল্পনিক সেবাসংক্রান্ত উদ্বেগ', 'summary' => $summaryBn],
                    ],
                ]);
                if (!$case->is_demo || $case->business_id !== $reviews[$index]->business_id || $case->review_id !== $reviews[$index]->id || $case->reporter_user_id !== $reviewer->id) {
                    throw new \RuntimeException('Reserved sample case code conflicts with another record.');
                }
            }

            foreach ($organizations as $organization) {
                $published = $organization->reviews()->where('status', 'published');
                $organization->update(['review_count' => $published->count(), 'rating' => round((float) $published->avg('rating'), 1)]);
            }
        });
    }

    private function media(int $index): array
    {
        $assets = ['delivery', 'parcel', 'receipt', 'service'];
        $count = $index % 3;
        $items = [];
        for ($mediaIndex = 0; $mediaIndex < $count; $mediaIndex++) {
            // The AI shop illustration belongs only to fictional shop fixtures, never real reports.
            if ($mediaIndex === 0 && in_array($index % self::ORGANIZATION_COUNT, [0,5], true)) {
                $items[] = self::shopIllustration();
                continue;
            }
            $asset = $assets[($index + $mediaIndex) % count($assets)];
            $items[] = ['url' => '/demo-media/'.$asset.'.svg', 'alt' => 'Fictional sample '.$asset.' illustration',
                'kind' => 'illustration', 'caption' => 'Fictional sample illustration, not submitted evidence.', 'approved_for_public' => true];
        }
        return $items;
    }

    public static function shopIllustration(): array
    {
        return ['url'=>PublicMedia::SAMPLE_SHOP_ILLUSTRATION,'alt'=>'AI-created fictional community shop illustration',
            'kind'=>'illustration','caption'=>'AI-created fictional sample illustration. No real organization, customer, event, or submitted evidence is depicted.','approved_for_public'=>true];
    }
}
