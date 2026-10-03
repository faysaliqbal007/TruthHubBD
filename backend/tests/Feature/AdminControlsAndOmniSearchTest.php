<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminControlsAndOmniSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_omni_search_finds_businesses_cases_reviews_and_comments(): void
    {
        $user = User::factory()->create(['role' => 'user', 'name' => 'Citizen Reviewer']);
        $biz = Business::create(['name' => 'Apex Healthcare', 'slug' => 'apex-healthcare', 'category' => 'Hospital', 'status' => 'approved', 'location' => 'Dhaka']);
        $case = ScamCase::create(['title' => 'Phishing Scheme Alert', 'case_code' => 'CS-9988', 'status' => 'published', 'published_at' => now(), 'summary' => 'Summary text', 'business_id' => $biz->id, 'reporter_user_id' => $user->id]);
        $review = Review::create(['business_id' => $biz->id, 'user_id' => $user->id, 'title' => 'Honest Experience', 'body' => 'Great service at apex clinic', 'rating' => 5, 'status' => 'published']);

        DB::table('review_comments')->insert([
            'review_id' => $review->id,
            'user_id' => $user->id,
            'body' => 'I completely agree with this analysis of apex.',
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $res = $this->getJson('/api/search/omni?q=Apex')->assertOk()->assertJsonPath('success', true);
        $data = $res->json('data');
        $this->assertNotEmpty($data);

        $kinds = array_column($data, 'kind');
        $this->assertContains('business', $kinds);
        $this->assertContains('review', $kinds);
        $this->assertContains('comment', $kinds);
    }

    public function test_admin_can_filter_business_accounts_and_restrict_or_delete_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $citizen = User::factory()->create(['role' => 'user', 'name' => 'Regular User']);
        $bizUser = User::factory()->create(['role' => 'user', 'name' => 'Merchant Owner']);
        Business::create(['name' => 'Merchant Store', 'slug' => 'merchant-store', 'category' => 'Retail', 'user_id' => $bizUser->id, 'status' => 'approved']);

        // Check user listing with role=business
        $this->actingAs($admin)->getJson('/api/admin/users?role=business')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $bizUser->id)
            ->assertJsonPath('data.0.business.name', 'Merchant Store');

        // Restrict citizen user
        $this->patchJson('/api/admin/users/' . $citizen->id . '/restrict', ['is_restricted' => true, 'restricted_reason' => 'Violation of community policies'])
            ->assertOk()
            ->assertJsonPath('user.is_restricted', true);
        $this->assertTrue($citizen->fresh()->is_restricted);

        // Delete citizen user
        $this->deleteJson('/api/admin/users/' . $citizen->id)
            ->assertOk()
            ->assertJsonPath('message', "User account {$citizen->email} has been permanently deleted.");
        $this->assertDatabaseMissing('users', ['id' => $citizen->id]);
    }

    public function test_admin_can_delete_reviews_and_scam_cases(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);
        $biz = Business::create(['name' => 'Target Shop', 'slug' => 'target-shop', 'category' => 'Shop', 'status' => 'approved', 'rating' => 4.0, 'review_count' => 1]);
        $review = Review::create(['business_id' => $biz->id, 'user_id' => $user->id, 'title' => 'Defamatory Fake Review', 'body' => 'Malicious text', 'rating' => 1, 'status' => 'published']);
        $case = ScamCase::create(['title' => 'Fake Case To Delete', 'case_code' => 'CS-0001', 'status' => 'published', 'published_at' => now(), 'summary' => 'Text', 'business_id' => $biz->id, 'reporter_user_id' => $user->id]);

        $this->actingAs($admin)->deleteJson('/api/admin/reviews/' . $review->id)
            ->assertOk()
            ->assertJsonPath('message', "Review #{$review->id} has been permanently deleted.");
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);

        $this->deleteJson('/api/admin/scam-cases/' . $case->id)
            ->assertOk()
            ->assertJsonPath('message', "Scam case {$case->case_code} has been permanently deleted.");
        $this->assertDatabaseMissing('scam_cases', ['id' => $case->id]);
    }

    public function test_admin_broadcast_notification(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $u1 = User::factory()->create(['role' => 'user']);
        $u2 = User::factory()->create(['role' => 'user']);

        $res = $this->actingAs($admin)->postJson('/api/admin/broadcast-notification', [
            'title' => 'Critical Platform Notice',
            'message' => 'Please review the updated privacy guidelines.',
            'target_role' => 'all',
            'action_url' => '/security'
        ])->assertOk();

        $this->assertGreaterThanOrEqual(3, $res->json('count'));
        $this->assertDatabaseHas('notifications', [
            'user_id' => $u1->id,
            'title' => 'Critical Platform Notice',
            'url' => '/security'
        ]);
    }

    public function test_restricted_user_is_blocked_from_protected_endpoints(): void
    {
        $restrictedUser = User::factory()->create([
            'role' => 'user',
            'is_restricted' => true,
            'restricted_reason' => 'Suspicious fraudulent activity.'
        ]);

        $this->actingAs($restrictedUser)
            ->getJson('/api/user')
            ->assertStatus(403)
            ->assertJsonPath('is_restricted', true)
            ->assertJsonPath('message', 'Suspicious fraudulent activity.');
    }

    public function test_omni_search_matches_review_body_content(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $biz = Business::create(['name' => 'Popular Diagnostic Center', 'slug' => 'popular-diagnostic', 'category' => 'Hospital', 'status' => 'approved', 'location' => 'Dhanmondi']);
        $review = Review::create([
            'business_id' => $biz->id,
            'user_id' => $user->id,
            'title' => 'Fast Report Delivery',
            'body' => 'UniqueKeywordUltrasonography test results were accurate and fast.',
            'rating' => 5,
            'status' => 'published'
        ]);

        $res = $this->getJson('/api/search/omni?q=UniqueKeywordUltrasonography')
            ->assertOk()
            ->assertJsonPath('success', true);

        $data = $res->json('data');
        $this->assertNotEmpty($data);
        $this->assertEquals('rev_' . $review->id, $data[0]['id']);
        $this->assertStringContainsString('UniqueKeywordUltrasonography', $data[0]['subtitle']);
    }
}

