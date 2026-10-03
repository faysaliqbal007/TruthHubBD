<?php

namespace Tests\Feature;

use App\Models\{Business, Review, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReviewReactionsTest extends TestCase
{
    use RefreshDatabase;

    private function review(array $extra = []): Review
    {
        $business = Business::create(['name' => 'Reaction fixture', 'slug' => 'reaction-fixture', 'category' => 'Products', 'status' => 'approved']);
        return Review::create($extra + ['business_id' => $business->id, 'author' => 'Customer', 'rating' => 4, 'title' => 'Experience', 'body' => 'Review body', 'status' => 'published']);
    }

    public function test_votes_toggle_switch_and_preserve_unattributed_existing_totals(): void
    {
        $review = $this->review(['helpful_count' => 7]);
        $this->actingAs(User::factory()->create());
        $url = '/api/reviews/'.$review->id.'/reaction';
        foreach ([['helpful', 8, 0, 'helpful'], ['helpful', 7, 0, null], ['not_helpful', 7, 1, 'not_helpful'], ['helpful', 8, 0, 'helpful'], ['not_helpful', 7, 1, 'not_helpful'], ['not_helpful', 7, 0, null]] as [$type, $helpful, $unhelpful, $viewer]) {
            $this->putJson($url, ['type' => $type])->assertOk()->assertJsonPath('helpful_count', $helpful)
                ->assertJsonPath('not_helpful_count', $unhelpful)->assertJsonPath('viewer_reaction', $viewer);
            $this->assertSame($helpful, $review->fresh()->helpful_count);
            $this->assertDatabaseCount('review_reactions', $viewer ? 1 : 0);
        }
    }

    public function test_existing_votes_are_honored_and_reaction_timestamp_is_preserved_on_switch(): void
    {
        $review = $this->review(['helpful_count' => 4]);
        $user = User::factory()->create();
        $created = now()->subDays(3)->format('Y-m-d H:i:s');
        DB::table('review_reactions')->insert(['review_id' => $review->id, 'user_id' => $user->id, 'type' => 'helpful', 'created_at' => $created, 'updated_at' => $created]);
        $this->actingAs($user)->putJson('/api/reviews/'.$review->id.'/reaction', ['type' => 'not_helpful'])
            ->assertOk()->assertJsonPath('helpful_count', 3)->assertJsonPath('not_helpful_count', 1);
        $this->assertDatabaseHas('review_reactions', ['review_id' => $review->id, 'type' => 'not_helpful', 'created_at' => $created]);
    }

    public function test_independent_voters_cannot_overwrite_each_others_counts_or_selection(): void
    {
        $review = $this->review();
        $first = User::factory()->create();
        $second = User::factory()->create();
        $url = '/api/reviews/'.$review->id.'/reaction';
        $this->actingAs($first)->putJson($url, ['type' => 'helpful'])->assertJsonPath('helpful_count', 1);
        $this->actingAs($second)->putJson($url, ['type' => 'helpful'])->assertJsonPath('helpful_count', 2);
        $this->actingAs($first)->putJson($url, ['type' => 'not_helpful'])->assertJsonPath('helpful_count', 1)->assertJsonPath('not_helpful_count', 1);
        $this->actingAs($second)->putJson($url, ['type' => 'helpful'])->assertJsonPath('helpful_count', 0)->assertJsonPath('not_helpful_count', 1);
        $this->assertDatabaseCount('review_reactions', 1);
        $this->assertDatabaseHas('review_reactions', ['user_id' => $first->id, 'type' => 'not_helpful']);
    }

    public function test_public_surfaces_return_counts_and_only_the_authenticated_viewers_reaction(): void
    {
        $review = $this->review(['helpful_count' => 5]);
        $viewer = User::factory()->create();
        DB::table('review_reactions')->insert(['review_id' => $review->id, 'user_id' => $viewer->id, 'type' => 'not_helpful', 'created_at' => now(), 'updated_at' => now()]);
        $surfaces = [['/api/reviews', 'data.0'], ['/api/reviews/recent', 'data.0'], ['/api/reviews/'.$review->id, 'data'], ['/api/businesses/reaction-fixture', 'data.reviews.0']];
        foreach ($surfaces as [$url, $path]) $this->getJson($url)->assertOk()->assertJsonPath($path.'.helpfulCount', 5)->assertJsonPath($path.'.notHelpfulCount', 1)->assertJsonPath($path.'.viewerReaction', null)->assertJsonPath($path.'.canReact', false);
        $this->actingAs($viewer, 'sanctum');
        foreach ($surfaces as [$url, $path]) $this->getJson($url)->assertOk()->assertJsonPath($path.'.viewerReaction', 'not_helpful')->assertJsonPath($path.'.canReact', true)->assertJsonMissingPath($path.'.reactions');
        $this->actingAs(User::factory()->create(), 'sanctum')->getJson('/api/reviews/'.$review->id)->assertJsonPath('data.viewer_reaction', null)->assertJsonPath('data.not_helpful_count', 1);
    }

    public function test_guests_own_reviews_unverified_users_and_private_reviews_cannot_be_reacted_to(): void
    {
        $owner = User::factory()->create();
        $review = $this->review(['user_id' => $owner->id]);
        $url = '/api/reviews/'.$review->id.'/reaction';
        $this->putJson($url, ['type' => 'helpful'])->assertUnauthorized();
        $this->actingAs($owner)->getJson('/api/reviews/'.$review->id)->assertJsonPath('data.canReact', false);
        $this->putJson($url, ['type' => 'helpful'])->assertUnprocessable();
        $this->actingAs(User::factory()->create(['email_verified_at' => null]))->putJson($url, ['type' => 'helpful'])->assertForbidden();
        $this->actingAs(User::factory()->create())->putJson($url, ['type' => 'invalid'])->assertUnprocessable();
        foreach (['under_review', 'limited', 'removed'] as $status) {
            $review->update(['status' => $status]);
            $this->putJson($url, ['type' => 'helpful'])->assertNotFound();
        }
        $this->assertDatabaseCount('review_reactions', 0);
    }
}
