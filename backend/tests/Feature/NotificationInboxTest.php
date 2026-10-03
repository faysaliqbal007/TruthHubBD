<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationInboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_fetch_or_mark_private_notifications(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->patchJson('/api/notifications/1/read')->assertUnauthorized();
    }

    public function test_recent_list_contains_at_most_thirty_owned_notices_with_stable_newest_order(): void
    {
        $viewer = User::factory()->create();
        $other = User::factory()->create();
        for ($index = 0; $index < 32; $index++) DB::table('notifications')->insert(['user_id' => $viewer->id, 'type' => 'review_comment', 'title' => 'New comment on your review', 'body' => 'Someone joined the conversation on your review.', 'url' => '/reviews/1', 'created_at' => now()->startOfDay(), 'updated_at' => now()]);
        DB::table('notifications')->insert(['user_id' => $other->id, 'type' => 'review_comment', 'title' => 'Other account private marker', 'body' => 'Private notice', 'created_at' => now()->addDay(), 'updated_at' => now()]);
        $this->actingAs($viewer, 'sanctum')->getJson('/api/notifications')->assertOk()->assertJsonCount(30, 'data')
            ->assertJsonPath('data.0.id', 32)->assertJsonPath('data.29.id', 3)->assertJsonPath('data.0.type', 'review_comment')
            ->assertJsonPath('data.0.read_at', null)->assertJsonStructure(['data' => [['created_at']]])->assertDontSee('Other account private marker');
    }

    public function test_read_controls_cannot_change_another_accounts_notice_and_preserve_the_list(): void
    {
        $viewer = User::factory()->create();
        $other = User::factory()->create();
        $own = DB::table('notifications')->insertGetId(['user_id' => $viewer->id, 'type' => 'case_update', 'title' => 'Case update', 'body' => 'Controlled status update', 'created_at' => now(), 'updated_at' => now()]);
        $foreign = DB::table('notifications')->insertGetId(['user_id' => $other->id, 'type' => 'case_update', 'title' => 'Other update', 'body' => 'Private notice', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($viewer, 'sanctum')->patchJson('/api/notifications/'.$foreign.'/read')->assertNoContent();
        $this->assertNull(DB::table('notifications')->find($foreign)->read_at);
        $this->patchJson('/api/notifications/'.$own.'/read')->assertNoContent();
        $this->assertNotNull(DB::table('notifications')->find($own)->read_at);
        $response = $this->getJson('/api/notifications')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $own);
        $this->assertNotNull($response->json('data.0.read_at'));
    }
}
