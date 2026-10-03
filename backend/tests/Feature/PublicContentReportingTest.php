<?php

namespace Tests\Feature;

use App\Models\{Business, Review, ScamCase, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PublicContentReportingTest extends TestCase
{
    use RefreshDatabase;

    private function entity(array $extra = []): Business
    {
        return Business::create($extra + ['name' => 'Report target', 'slug' => 'report-target-'.Business::count(), 'category' => 'Products', 'status' => 'approved']);
    }

    private function review(Business $business, string $status = 'published'): Review
    {
        return Review::create(['business_id' => $business->id, 'author' => 'Customer', 'rating' => 4, 'title' => 'Review title', 'body' => 'Firsthand experience', 'status' => $status]);
    }

    private function caseFor(Business $business, User $user, string $status = 'published', bool $published = true): ScamCase
    {
        return ScamCase::create(['business_id' => $business->id, 'reporter_user_id' => $user->id, 'case_code' => 'CASE-'.ScamCase::count(), 'title' => 'Private case title', 'summary' => 'private-marker-9827', 'public_summary' => 'Approved summary', 'status' => $status, 'published_at' => $published ? now() : null]);
    }

    private function payload(string $type, int $id): array
    {
        return ['reportable_type' => $type, 'reportable_id' => $id, 'reason' => 'Inaccurate content', 'details' => 'Please review this public item.'];
    }

    public function test_authenticated_users_can_report_public_reviews_and_cases_without_changing_target_status(): void
    {
        $reporter = User::factory()->create();
        $business = $this->entity();
        $review = $this->review($business);
        $case = $this->caseFor($business, User::factory()->create());
        $this->actingAs($reporter);
        foreach ([['review', $review->id], ['scam_case', $case->id]] as [$type, $id]) {
            $this->postJson('/api/reports', $this->payload($type, $id))->assertCreated()
                ->assertJsonPath('data.reportable_type', $type)->assertJsonPath('data.reportable_id', $id)
                ->assertJsonPath('data.status', 'open')->assertJsonMissingPath('data.summary')->assertDontSee('private-marker-9827');
            $this->assertDatabaseHas('content_reports', ['reporter_user_id' => $reporter->id, 'reportable_type' => $type, 'reportable_id' => $id, 'status' => 'open']);
        }
        $this->assertSame('published', $review->fresh()->status);
        $this->assertSame('published', $case->fresh()->status);
        $this->assertDatabaseCount('content_reports', 2);
    }

    public function test_guests_cannot_report_any_public_item(): void
    {
        $business = $this->entity();
        $review = $this->review($business);
        $case = $this->caseFor($business, User::factory()->create());
        $this->postJson('/api/reports', $this->payload('review', $review->id))->assertUnauthorized();
        $this->postJson('/api/reports', $this->payload('scam_case', $case->id))->assertUnauthorized();
        $this->assertDatabaseCount('content_reports', 0);
    }

    public function test_hidden_and_nonexistent_review_or_case_targets_return_identical_not_found_responses(): void
    {
        config(['app.debug' => false]);
        $user = User::factory()->create();
        $business = $this->entity();
        $this->actingAs($user);
        $missingReview = $this->postJson('/api/reports', $this->payload('review', 999999))->assertNotFound()->json();
        foreach (['under_review', 'limited', 'removed'] as $status) {
            $review = $this->review($business, $status);
            $response = $this->postJson('/api/reports', $this->payload('review', $review->id))->assertNotFound()->assertDontSee('Firsthand experience');
            $this->assertSame($missingReview, $response->json());
            $this->assertSame($status, $review->fresh()->status);
        }
        $missingCase = $this->postJson('/api/reports', $this->payload('scam_case', 999999))->assertNotFound()->json();
        foreach ([['submitted', false], ['needs_evidence', false], ['under_review', false], ['published', false], ['restricted', true], ['not_enough_evidence', true]] as [$status, $published]) {
            $case = $this->caseFor($business, $user, $status, $published);
            $response = $this->postJson('/api/reports', $this->payload('scam_case', $case->id))->assertNotFound()->assertDontSee('private-marker-9827');
            $this->assertSame($missingCase, $response->json());
            $this->assertSame($status, $case->fresh()->status);
        }
        $this->assertDatabaseCount('content_reports', 0);
    }

    public function test_previously_published_public_case_states_remain_reportable(): void
    {
        $user = User::factory()->create();
        $business = $this->entity();
        $this->actingAs($user);
        foreach (['under_review', 'disputed', 'resolved'] as $status) {
            $case = $this->caseFor($business, $user, $status);
            $this->postJson('/api/reports', $this->payload('scam_case', $case->id))->assertCreated();
            $this->assertSame($status, $case->fresh()->status);
        }
        $this->assertDatabaseCount('content_reports', 3);
    }

    public function test_hidden_comments_and_directory_records_cannot_be_reported_through_the_public_route(): void
    {
        $user = User::factory()->create();
        $business = $this->entity();
        $public = $this->review($business);
        $private = $this->review($business, 'under_review');
        $this->actingAs($user);
        foreach ([[$public, 'removed'], [$private, 'published']] as [$review, $status]) {
            $id = DB::table('review_comments')->insertGetId(['review_id' => $review->id, 'user_id' => $user->id, 'body' => 'Private comment', 'status' => $status, 'created_at' => now(), 'updated_at' => now()]);
            $this->postJson('/api/reports', $this->payload('comment', $id))->assertNotFound();
        }
        $rejected = $this->entity(['status' => 'rejected']);
        $merged = $this->entity(['merged_into_id' => $business->id]);
        foreach ([$rejected->id, $merged->id, 999999] as $id) $this->postJson('/api/reports', $this->payload('business', $id))->assertNotFound();
        $this->postJson('/api/reports', $this->payload('comment', 999999))->assertNotFound();
        $this->assertDatabaseCount('content_reports', 0);
    }
}
