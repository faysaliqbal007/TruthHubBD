<?php

namespace Tests\Feature;

use App\Models\{Business, Review, ScamCase, User};
use Database\Seeders\{DemoExperienceSeeder, DemoPublicMediaSeeder};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityOverviewAndMediaTest extends TestCase
{
    use RefreshDatabase;

    private function entity(string $slug, ?string $location = null, array $extra = []): Business
    {
        return Business::create($extra + ['name' => $slug, 'slug' => $slug, 'category' => 'Products', 'location' => $location, 'status' => 'approved']);
    }

    private function caseFor(Business $business, User $user, string $code, array $extra = []): ScamCase
    {
        return ScamCase::create($extra + ['case_code' => $code, 'business_id' => $business->id, 'reporter_user_id' => $user->id, 'title' => 'private-title-secret', 'summary' => 'private-summary-secret', 'amount' => 90001, 'public_summary' => 'Approved public summary', 'status' => 'published', 'published_at' => now()]);
    }

    private function photo(string $url = '/public-media/redacted-copy.jpg'): array
    {
        return ['url' => $url, 'alt' => 'Redacted public image', 'kind' => 'photo', 'caption' => 'Approved copy', 'approved_for_public' => true, 'consent_confirmed' => true, 'redacted' => true];
    }

    public function test_overview_has_all_eight_divisions_with_zero_counts_when_empty(): void
    {
        $response = $this->getJson('/api/community-overview')->assertOk()->assertJsonCount(8, 'data.divisions')
            ->assertJsonPath('data.totals.directory_listings', 0)->assertJsonPath('data.totals.public_cases', 0)
            ->assertJsonPath('data.divisions.1.name', 'Chattogram')->assertJsonPath('data.divisions.4.name', 'Barishal');
        foreach ($response->json('data.divisions') as $division) $this->assertSame(0, $division['directory_listings']);
    }

    public function test_overview_counts_sources_public_cases_and_unknown_addresses_without_private_details(): void
    {
        $user = User::factory()->create();
        $imported = $this->entity('source-listing', 'Gazipur, Bangladesh', ['source_ref' => 'osm:node/123']);
        $community = $this->entity('community-listing', 'Chattogram', ['status' => 'pending']);
        $demo = $this->entity('fixture', 'বরিশাল', ['is_demo' => true]);
        $unknown = $this->entity('no-location');
        $this->entity('ambiguous', 'Dhaka / Sylhet');
        $this->entity('partial-name', 'Dhakaish');
        $this->entity('rejected', 'Dhaka', ['status' => 'rejected']);
        $this->entity('merged', 'Dhaka', ['merged_into_id' => $imported->id]);
        $this->caseFor($imported, $user, 'LIVE-1');
        $this->caseFor($community, $user, 'LIVE-2', ['status' => 'resolved']);
        $this->caseFor($demo, $user, 'DEMO-1', ['is_demo' => true]);
        $this->caseFor($unknown, $user, 'LIVE-UNKNOWN');
        $this->caseFor($imported, $user, 'UNPUBLISHED', ['published_at' => null]);
        $this->caseFor($imported, $user, 'RESTRICTED', ['status' => 'restricted']);
        $response = $this->getJson('/api/community-overview')->assertOk()
            ->assertJsonPath('data.totals.directory_listings', 6)->assertJsonPath('data.totals.imported_listings', 1)
            ->assertJsonPath('data.totals.community_listings', 4)->assertJsonPath('data.totals.demo_listings', 1)
            ->assertJsonPath('data.totals.public_cases', 3)->assertJsonPath('data.totals.demo_cases', 1)
            ->assertJsonPath('data.unknown_location.directory_listings', 3)->assertJsonPath('data.unknown_location.public_cases', 1)
            ->assertDontSee('private-summary-secret')->assertDontSee('private-title-secret')->assertDontSee('90001')
            ->assertDontSee('reporter_user_id')->assertDontSee('LIVE-1');
        $rows = collect($response->json('data.divisions'))->keyBy('key');
        $this->assertSame(1, $rows['dhaka']['directory_listings']);
        $this->assertSame(1, $rows['chattogram']['public_cases']);
        $this->assertSame(1, $rows['barishal']['demo_cases']);
        $this->getJson('/api/businesses')->assertJsonPath('total', 6);
        $this->getJson('/api/businesses?location=Dhaka%20Division')->assertJsonPath('total', 1);
        $this->getJson('/api/businesses?location=Sylhet%20Division')->assertJsonPath('total', 0);
        $this->getJson('/api/scam-cases')->assertJsonPath('data.total', 4);
    }

    public function test_canonical_division_filters_include_recorded_modern_and_legacy_names(): void
    {
        $this->entity('modern', 'Chattogram');
        $this->entity('legacy', 'Chittagong');
        $this->entity('district', 'Cumilla');
        $this->entity('barishal', 'Barishal');
        $this->getJson('/api/businesses?location=Chattogram%20Division')->assertOk()->assertJsonPath('total', 3);
        $this->getJson('/api/businesses?location=Barishal%20Division')->assertJsonPath('total', 1);
    }

    public function test_review_feed_profile_and_detail_publish_only_approved_public_media(): void
    {
        $business = $this->entity('public-review', 'Dhaka');
        $unapproved = $this->photo('/public-media/unapproved.jpg'); unset($unapproved['approved_for_public']);
        $unsafe = $this->photo('https://tracker.example.test/a.jpg');
        $review = Review::create(['business_id' => $business->id, 'author' => 'Customer', 'rating' => 4, 'title' => 'Review', 'body' => 'Experience', 'status' => 'published', 'image_path' => 'private:receipt-secret.pdf', 'evidence_paths' => [['path' => 'review-evidence/private-secret.pdf']], 'public_media' => [$this->photo(), $unapproved, $unsafe]]);
        foreach ([['/api/reviews/recent', 'data.0'], ['/api/businesses/public-review', 'data.reviews.0'], ['/api/reviews/'.$review->id, 'data']] as [$url, $path]) {
            $this->getJson($url)->assertOk()->assertJsonCount(1, $path.'.public_media')
                ->assertJsonPath($path.'.public_media.0.url', '/public-media/redacted-copy.jpg')
                ->assertJsonMissingPath($path.'.public_media.0.approved_for_public')->assertJsonMissingPath($path.'.evidence_paths')
                ->assertDontSee('receipt-secret')->assertDontSee('private-secret')->assertDontSee('tracker.example.test')->assertDontSee('unapproved.jpg');
        }
    }

    public function test_media_sanitizer_rejects_private_paths_trackers_traversal_active_content_and_unconsented_photos(): void
    {
        $business = $this->entity('media-test');
        $user = User::factory()->create();
        $urls = ['private:receipt.png', '/storage/review-evidence/secret.png', '/public-media/../private.png', '/public-media/%2e%2e/secret.png', '//tracker.example.test/a.png', 'javascript:alert(1)', 'https://tracker.example.test/a.png', '/public-media/image.png?track=1', '/public-media/active.svg', '/demo-media/delivery.svg'];
        foreach ($urls as $index => $url) {
            $case = $this->caseFor($business, $user, 'UNSAFE-'.$index, ['public_media' => [$this->photo($url)]]);
            $this->getJson('/api/scam-cases/'.$case->case_code)->assertOk()->assertJsonCount(0, 'data.public_media');
        }
        foreach (['consent_confirmed', 'redacted', 'approved_for_public'] as $field) {
            $photo = $this->photo(); $photo[$field] = false;
            $case = $this->caseFor($business, $user, 'NO-'.$field, ['public_media' => [$photo]]);
            $this->getJson('/api/scam-cases/'.$case->case_code)->assertJsonCount(0, 'data.public_media');
        }
        $case = $this->caseFor($business, $user, 'SAFE', ['public_media' => [$this->photo()]]);
        $this->getJson('/api/scam-cases/SAFE')->assertJsonCount(1, 'data.public_media')->assertJsonMissingPath('data.amount')->assertJsonMissingPath('data.evidence');
        $this->getJson('/api/scam-cases')->assertDontSee('tracker.example.test')->assertDontSee('private-title-secret')->assertDontSee('private-summary-secret');
    }

    public function test_user_submissions_cannot_self_approve_media_or_mark_real_reports_as_demo(): void
    {
        $business = $this->entity('user-report');
        $this->actingAs(User::factory()->create());
        $response = $this->postJson('/api/businesses/'.$business->id.'/reviews', ['rating' => 4, 'title' => 'Experience', 'body' => 'My visit', 'public_media' => [$this->photo()], 'is_demo' => true])->assertCreated();
        $this->assertFalse(Review::findOrFail($response->json('data.id'))->is_demo);
        $this->assertSame([], Review::findOrFail($response->json('data.id'))->public_media);
        $response = $this->postJson('/api/businesses/'.$business->id.'/scam-cases', ['title' => 'Private case', 'summary' => 'Private report', 'public_media' => [$this->photo()], 'is_demo' => true])->assertCreated();
        $case = ScamCase::findOrFail($response->json('data.id'));
        $this->assertFalse($case->is_demo);
        $this->assertSame([], $case->public_media);
    }

    public function test_demo_public_media_is_fictional_explicit_and_narrowly_scoped(): void
    {
        $this->seed(DemoExperienceSeeder::class);
        $business = $this->entity('real-report', 'Dhaka');
        $review = Review::create(['business_id' => $business->id, 'author' => 'Demo Reviewer', 'rating' => 4, 'title' => 'Real review', 'body' => 'My actual visit', 'status' => 'published']);
        $before = Business::count();
        $this->seed(DemoPublicMediaSeeder::class);
        $this->assertSame($before, Business::count());
        $this->assertFalse($review->fresh()->is_demo);
        $this->assertSame([], $review->fresh()->public_media);
        $this->getJson('/api/community-overview')->assertJsonPath('data.totals.demo_listings', 4)
            ->assertJsonPath('data.totals.public_cases', 0)->assertJsonPath('data.totals.demo_cases', 3);
        $this->getJson('/api/scam-cases/DEMO-2026-1')->assertJsonPath('data.is_demo', true)
            ->assertJsonPath('data.public_media.0.kind', 'illustration')->assertJsonPath('data.public_media.0.url', '/demo-media/delivery.svg');
        $this->getJson('/api/businesses/demo-northline-electronics')->assertJsonPath('data.reviews.0.is_demo', true)
            ->assertJsonPath('data.reviews.0.public_media.0.caption', 'Fictional demo illustration. Not submitted evidence.');
    }
}
