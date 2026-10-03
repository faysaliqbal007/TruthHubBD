<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Issue #2 & Issue #6: Test searching businesses from real database data.
     */
    public function test_can_search_businesses_from_database(): void
    {
        Business::create([
            'name' => 'Dhaka Medical College Hospital',
            'bengali_name' => 'ঢাকা মেডিকেল কলেজ হাসপাতাল',
            'slug' => 'dhaka-medical-college-hospital',
            'category' => 'Hospitals & Clinics',
            'description' => 'Tertiary referral hospital in Dhaka',
            'location' => 'Secretariat Road, Dhaka',
            'rating' => 4.5,
            'review_count' => 10,
            'verified' => true,
        ]);

        Business::create([
            'name' => 'Star Tech Elephant Road',
            'slug' => 'star-tech-elephant-road',
            'category' => 'Businesses & Services',
            'description' => 'Computer retailer in Multiplan',
            'location' => 'Multiplan Center, Dhaka',
            'rating' => 4.8,
            'review_count' => 50,
            'verified' => true,
        ]);

        // Search for 'Medical'
        $response = $this->getJson('/api/businesses?q=Medical');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.name', 'Dhaka Medical College Hospital');
    }

    /**
     * Issue #3, #4, #5: Test submitting review with optional location, optional facebook URL, and file upload.
     */
    public function test_can_submit_review_with_optional_fields_and_file_upload(): void
    {
        Storage::fake('private');
        $reviewer = User::factory()->create(['email_verified_at' => now()]);

        $business = Business::create([
            'name' => 'Sample Hospital',
            'slug' => 'sample-hospital',
            'category' => 'Hospitals & Clinics',
            'rating' => 4.0,
            'review_count' => 1,
        ]);

        $file = UploadedFile::fake()->create('receipt.png', 500, 'image/png');

        $payload = [
            'author' => 'Student Reviewer',
            'rating' => 5,
            'title' => 'Excellent service and clear consultation',
            'body' => 'The doctor spent 30 minutes explaining the diagnosis clearly.',
            // Issue #3: Location is optional (provided here)
            'location' => 'Dhanmondi, Dhaka',
            // Issue #4: Facebook URL is optional (provided here)
            'facebook_url' => 'https://facebook.com/student.reviewer',
            // Issue #5: File upload provided
            'file' => $file,
        ];

        $response = $this->actingAs($reviewer, 'sanctum')->postJson("/api/businesses/{$business->id}/reviews", $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.title', 'Excellent service and clear consultation')
                 ->assertJsonPath('data.location', 'Dhanmondi, Dhaka')
                 ->assertJsonPath('data.facebook_url', 'https://facebook.com/student.reviewer');

        $this->assertDatabaseHas('reviews', [
            'business_id' => $business->id,
            'title' => 'Excellent service and clear consultation',
            'location' => 'Dhanmondi, Dhaka',
            'facebook_url' => 'https://facebook.com/student.reviewer',
        ]);
    }

    /**
     * Business Creation Test: Test business users creating new business entity.
     */
    public function test_can_create_business_entity(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $payload = [
            'name' => 'Green Life Diagnostic Center',
            'bengali_name' => 'গ্রীন লাইফ ডায়াগনস্টিক সেন্টার',
            'category' => 'Hospitals & Clinics',
            'description' => 'Diagnostic and pathology lab services',
            'location' => 'Green Road, Dhanmondi, Dhaka',
            'phone' => '01711-000000',
            'website' => 'https://greenlifediagnostic.com',
            'facebook_url' => 'https://facebook.com/greenlifediagnostic',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/businesses', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.name', 'Green Life Diagnostic Center');

        $this->assertDatabaseHas('businesses', [
            'name' => 'Green Life Diagnostic Center',
            'slug' => 'green-life-diagnostic-center',
        ]);
    }

    /**
     * Unclaimed business creator cannot edit business facts without approved claim.
     */
    public function test_creator_cannot_edit_unclaimed_business_info(): void
    {
        $creator = User::factory()->create(['email_verified_at' => now()]);
        $business = Business::create([
            'name' => 'Unclaimed Business',
            'slug' => 'unclaimed-business',
            'category' => 'Businesses & Services',
            'created_by_user_id' => $creator->id,
            'user_id' => null,
            'verified' => false,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($creator, 'sanctum')->patchJson("/api/businesses/{$business->id}", [
            'name' => 'Hacked New Name',
            'description' => 'Should be rejected',
        ]);

        $response->assertStatus(403)
                 ->assertJsonPath('success', false)
                 ->assertSee('Unauthorized. You must claim this organization account before you can edit its profile information.');
    }

    /**
     * Admin can permanently delete an organization from admin panel.
     */
    public function test_admin_can_delete_organization(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $business = Business::create([
            'name' => 'To Be Deleted Business',
            'slug' => 'to-be-deleted-business',
            'category' => 'Products',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/businesses/{$business->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('businesses', [
            'id' => $business->id,
        ]);
    }
}
