<?php

namespace Tests\Feature;

use App\Models\{Business, Review, ScamCase, User};
use Database\Seeders\{DemoExperienceSeeder, DemoPublicMediaSeeder};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReviewDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    private function entity(string $slug, string $location = 'Dhaka', string $category = 'Products'): Business
    {
        return Business::create(['name' => $slug, 'slug' => $slug, 'category' => $category, 'location' => $location, 'status' => 'approved']);
    }

    private function review(Business $business, array $extra = []): Review
    {
        return Review::create($extra + ['business_id' => $business->id, 'author' => 'Customer', 'rating' => 4, 'title' => 'Delivery experience', 'body' => 'Clear communication', 'status' => 'published']);
    }

    public function test_public_feed_is_paginated_newest_with_stable_ties_and_no_hidden_reviews(): void
    {
        $business = $this->entity('public-shop');
        for ($index = 0; $index < 23; $index++) $this->review($business, ['created_at' => now()->startOfDay()]);
        foreach (['under_review', 'limited', 'removed'] as $status) $this->review($business, ['status' => $status, 'title' => 'private-review-marker']);
        $this->getJson('/api/reviews')->assertOk()->assertJsonCount(20, 'data')->assertJsonPath('total', 23)
            ->assertJsonPath('page', 1)->assertJsonPath('last_page', 2)->assertJsonPath('data.0.id', 23)->assertJsonPath('data.19.id', 4)
            ->assertDontSee('private-review-marker')->assertJsonPath('data.0.businessName', 'public-shop')->assertJsonPath('data.0.author', 'Customer');
        $this->getJson('/api/reviews?page=2')->assertJsonCount(3, 'data')->assertJsonPath('data.0.id', 3);
        $this->getJson('/api/reviews?sort=oldest')->assertJsonPath('data.0.id', 1);
        $this->getJson('/api/reviews/recent')->assertJsonCount(6, 'data')->assertJsonPath('data.0.id', 23);
        $this->getJson('/api/reviews?lang=other')->assertUnprocessable();
    }

    public function test_review_body_business_name_category_and_division_search_filter_before_pagination(): void
    {
        $dhaka = $this->entity('Northline Store', 'Gazipur', 'Products');
        $sylhet = $this->entity('River Clinic', 'Sylhet', 'Hospitals & Clinics');
        $ambiguous = $this->entity('Ambiguous Place', 'Dhaka / Sylhet', 'Products');
        $this->review($dhaka, ['body' => 'Helpful warranty service']);
        $this->review($sylhet, ['body' => 'Helpful appointment service']);
        $this->review($ambiguous);
        $this->getJson('/api/reviews?q=warranty')->assertJsonPath('total', 1)->assertJsonPath('data.0.businessSlug', 'Northline Store');
        $this->getJson('/api/reviews?q=Northline')->assertJsonPath('total', 1);
        $this->getJson('/api/reviews?category=Products&location=Dhaka%20Division')->assertJsonPath('total', 1)->assertJsonPath('data.0.businessLocation', 'Gazipur');
        $this->getJson('/api/reviews?category=Hospitals%20%26%20Clinics&location=Sylhet%20Division&q=appointment')->assertJsonPath('total', 1);
        $this->getJson('/api/reviews?category=Products&q=appointment')->assertJsonPath('total', 0);
    }

    public function test_published_comment_counts_are_authoritative_on_feed_profile_detail_and_recent(): void
    {
        $business = $this->entity('comments-shop');
        $review = $this->review($business, ['discussion_count' => 99]);
        $user = User::factory()->create();
        foreach (['published', 'published', 'limited', 'removed'] as $status) DB::table('review_comments')->insert(['review_id' => $review->id, 'user_id' => $user->id, 'body' => 'Comment', 'status' => $status, 'created_at' => now(), 'updated_at' => now()]);
        foreach ([['/api/reviews', 'data.0'], ['/api/reviews/recent', 'data.0'], ['/api/reviews/'.$review->id, 'data'], ['/api/businesses/comments-shop', 'data.reviews.0']] as [$url, $path]) {
            $this->getJson($url)->assertOk()->assertJsonPath($path.'.discussionCount', 2);
        }
        DB::table('review_comments')->where('status', 'published')->update(['status' => 'removed']);
        $this->getJson('/api/reviews')->assertJsonPath('data.0.discussionCount', 0);
    }

    public function test_only_approved_translations_are_serialized_and_searchable_without_changing_originals(): void
    {
        $business = $this->entity('translation-shop');
        $review = $this->review($business, ['translations' => ['bn' => ['approved_for_public' => true, 'title' => 'অনুমোদিত রিভিউ', 'body' => 'সহায়ক যোগাযোগ'], 'en' => ['title' => 'unapproved-secret-marker', 'body' => 'private-translated-marker']]]);
        $this->getJson('/api/reviews?lang=bn')->assertJsonPath('data.0.title', 'Delivery experience')
            ->assertJsonPath('data.0.translations.bn.title', 'অনুমোদিত রিভিউ')->assertJsonMissingPath('data.0.translations.en')
            ->assertJsonMissingPath('data.0.translations.bn.approved_for_public')->assertDontSee('unapproved-secret-marker');
        $this->getJson('/api/reviews?q='.urlencode('সহায়ক'))->assertJsonPath('total', 1);
        $this->getJson('/api/reviews?q=unapproved-secret-marker')->assertJsonPath('total', 0);
        $this->assertSame('Delivery experience', $review->fresh()->title);
        $this->assertSame('Clear communication', $review->fresh()->body);
        $user = User::factory()->create();
        $case = ScamCase::create([
            'business_id' => $business->id, 'reporter_user_id' => $user->id, 'case_code' => 'PUBLIC-TRANSLATION',
            'title' => 'private-title', 'summary' => 'private-summary', 'public_summary' => 'Original approved summary',
            'status' => 'published', 'published_at' => now(),
            'translations' => ['bn' => ['approved_for_public' => true, 'title' => 'প্রকাশিত কেস', 'summary' => 'অনুমোদিত প্রকাশ্য সারাংশ', 'body' => 'private-translated-marker']],
        ]);
        $this->getJson('/api/scam-cases/'.$case->case_code)->assertJsonPath('data.summary', 'Original approved summary')
            ->assertJsonPath('data.translations.bn.summary', 'অনুমোদিত প্রকাশ্য সারাংশ')->assertJsonMissingPath('data.translations.bn.body')
            ->assertDontSee('private-translated-marker')->assertDontSee('private-summary');
    }

    public function test_discovery_never_publishes_original_evidence_and_limits_public_gallery_to_twenty(): void
    {
        $business = $this->entity('gallery-shop');
        $item = ['url' => '/public-media/approved.jpg', 'alt' => 'Approved public copy', 'kind' => 'photo', 'approved_for_public' => true, 'consent_confirmed' => true, 'redacted' => true];
        $this->review($business, ['image_path' => 'private:secret-original.png', 'evidence_paths' => [['path' => 'review-evidence/private-original.png']], 'public_media' => array_fill(0, 21, $item)]);
        $this->getJson('/api/reviews')->assertJsonCount(20, 'data.0.public_media')->assertJsonMissingPath('data.0.evidence_paths')
            ->assertJsonPath('data.0.imagePath', null)->assertDontSee('secret-original')->assertDontSee('private-original');
    }

    public function test_fictional_demo_fixtures_cover_no_one_and_multiple_images_with_approved_bilingual_text(): void
    {
        $this->seed(DemoExperienceSeeder::class);
        $response = $this->getJson('/api/reviews?lang=bn')->assertOk()->assertJsonPath('total', 4);
        $rows = collect($response->json('data'))->keyBy('businessSlug');
        $this->assertCount(0, $rows['demo-riverstone-clinic']['public_media']);
        $this->assertCount(1, $rows['demo-northline-electronics']['public_media']);
        $this->assertCount(3, $rows['demo-learning-house']['public_media']);
        $this->assertCount(4, $rows['demo-parcel-path']['public_media']);
        foreach ($rows as $row) {
            $this->assertTrue($row['is_demo']);
            $this->assertSame(3, $row['discussionCount']);
            $this->assertStringContainsString('কাল্পনিক নমুনা তথ্য', $row['translations']['bn']['body']);
            $this->assertSame($row['title'], $row['translations']['en']['title']);
            $this->assertSame($row['body'], $row['translations']['en']['body']);
        }
        $this->assertCount(4, array_unique($rows->pluck('title')->all()));
        $this->assertCount(4, array_unique($rows->pluck('body')->all()));
        $northline = $rows['demo-northline-electronics'];
        $detail = $this->getJson('/api/reviews/'.$northline['id'])->assertJsonCount(3, 'data.comments')
            ->assertJsonMissingPath('data.comments.0.author_identity')->assertDontSee('preview@example.test');
        $this->assertSame($detail->json('data.comments.0.id'), $detail->json('data.comments.2.parent_id'));
        $this->assertStringContainsString('কাল্পনিক ডেমো', $detail->json('data.comments.0.translations.bn.body'));
        $this->seed(DemoPublicMediaSeeder::class);
        $this->assertDatabaseCount('review_comments', 12);
        $again = $this->getJson('/api/reviews?lang=bn')->json('data');
        $this->assertSame($response->json('data'), $again);
    }

    public function test_fixture_story_polish_requires_demo_identity_and_preserves_real_text_and_ratings(): void
    {
        $this->seed(DemoExperienceSeeder::class);
        $business = Business::where('slug', 'demo-northline-electronics')->firstOrFail();
        $fixture = Review::where('business_id', $business->id)->firstOrFail();
        $legacyTitle = 'Clear communication and a helpful team';
        $legacyBody = 'Demonstration review: the team explained the process clearly and answered my questions. This is sample content, not a real customer experience.';
        $expectedTitle = $fixture->title;
        $fixture->update(['title' => $legacyTitle, 'body' => $legacyBody]);
        $real = $this->review($business, ['user_id' => $fixture->user_id, 'author' => 'Demo Reviewer', 'title' => $legacyTitle, 'body' => $legacyBody, 'is_demo' => false]);
        $otherParticipant = $this->review($business, ['user_id' => User::factory()->create()->id, 'author' => 'Demo Reviewer', 'title' => $legacyTitle, 'body' => $legacyBody, 'is_demo' => true]);
        $communityEdit = $this->review($business, ['user_id' => $fixture->user_id, 'author' => 'Demo Reviewer', 'title' => 'My own edited review', 'body' => 'My original community experience', 'is_demo' => true]);
        $before = Review::count();
        $this->seed(DemoPublicMediaSeeder::class);
        $this->assertSame($before, Review::count());
        $this->assertSame($expectedTitle, $fixture->fresh()->title);
        $this->assertSame(4, $fixture->fresh()->rating);
        foreach ([$real, $otherParticipant] as $untouched) {
            $this->assertSame($legacyTitle, $untouched->fresh()->title);
            $this->assertSame($legacyBody, $untouched->fresh()->body);
        }
        $this->assertFalse($real->fresh()->is_demo);
        $this->assertSame('My own edited review', $communityEdit->fresh()->title);
        $this->assertSame('My original community experience', $communityEdit->fresh()->body);
    }
}
