<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScamCaseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_evidence_is_private_and_invalid_upload_does_not_create_a_case(): void
    {
        \Illuminate\Support\Facades\Storage::fake('private');
        $this->actingAs(User::factory()->create(['email_verified_at' => now()]), 'sanctum');
        $business = Business::create(['name'=>'Fictional upload test','slug'=>'upload-test','category'=>'Products']);
        $payload = ['title'=>'Test report','summary'=>'Fictional evidence submission.'];
        $this->postJson("/api/businesses/{$business->id}/scam-cases", $payload + ['evidence'=>[\Illuminate\Http\UploadedFile::fake()->create('oversize.pdf',10241,'application/pdf')]])->assertUnprocessable();
        $this->assertDatabaseCount('scam_cases',0);
        $response = $this->postJson("/api/businesses/{$business->id}/scam-cases", $payload + ['evidence'=>[\Illuminate\Http\UploadedFile::fake()->create('receipt.pdf',10,'application/pdf')]])->assertCreated();
        $case = \App\Models\ScamCase::findOrFail($response->json('data.id'));
        $evidence = $case->evidence()->firstOrFail();
        $this->assertTrue((bool) $evidence->is_private);
        \Illuminate\Support\Facades\Storage::disk('private')->assertExists($evidence->storage_path);
        $this->getJson('/api/scam-cases/'.$case->case_code)->assertNotFound();
    }

    public function test_reporter_can_submit_a_private_case_and_only_admin_can_publish_it(): void
    {
        $reporter = User::factory()->create(['email_verified_at' => now()]);
        $moderator = User::factory()->create(['role' => 'moderator', 'email_verified_at' => now()]);
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $business = Business::create(['name' => 'Case Target', 'slug' => 'case-target', 'category' => 'Businesses & Services']);

        $created = $this->actingAs($reporter, 'sanctum')->postJson("/api/businesses/{$business->id}/scam-cases", ['title' => 'Unfulfilled order report', 'summary' => 'I submitted private evidence for an order that was not fulfilled.', 'amount' => 4500]);
        $created->assertCreated()->assertJsonPath('data.status', 'submitted');
        $caseId = $created->json('data.id');

        $this->actingAs($moderator, 'sanctum')->patchJson("/api/moderation/scam-cases/{$caseId}", ['status' => 'published'])->assertForbidden();
        $this->actingAs($admin, 'sanctum')->patchJson("/api/moderation/scam-cases/{$caseId}", ['status' => 'published', 'public_summary' => 'Evidence reviewed under platform policy.', 'decision_rationale'=>'Redaction and consent checked under platform policy.'])->assertOk()->assertJsonPath('data.status', 'published');
    }

    public function test_scam_case_submission_stores_images_in_public_media_and_sets_alert_requested(): void
    {
        \Illuminate\Support\Facades\Storage::fake('private');
        \Illuminate\Support\Facades\Storage::fake('public');

        $reporter = User::factory()->create(['email_verified_at' => now()]);
        $business = Business::create(['name' => 'Tech Gadgets BD', 'slug' => 'tech-gadgets-bd', 'category' => 'Products']);

        $image1 = \Illuminate\Http\UploadedFile::fake()->create('receipt1.jpg', 50, 'image/jpeg');
        $image2 = \Illuminate\Http\UploadedFile::fake()->create('defective_box.png', 50, 'image/png');

        $response = $this->actingAs($reporter, 'sanctum')->postJson("/api/businesses/{$business->id}/scam-cases", [
            'title' => 'Faulty Product No Refund',
            'summary' => 'Purchased a mobile phone with broken display, shop denied refund.',
            'alert_requested' => true,
            'evidence' => [$image1, $image2],
        ]);

        $response->assertCreated();
        $caseId = $response->json('data.id');
        $case = \App\Models\ScamCase::findOrFail($caseId);

        $this->assertTrue((bool) $case->alert_requested);
        $this->assertCount(2, $case->public_media);
        $this->assertEquals('photo', $case->public_media[0]['kind']);
        $this->assertStringStartsWith('/storage/scam-media/', $case->public_media[0]['url']);
        $this->assertEquals('photo', $case->public_media[1]['kind']);
        $this->assertStringStartsWith('/storage/scam-media/', $case->public_media[1]['url']);

        // Check public API output
        $showRes = $this->getJson("/api/scam-cases/{$case->case_code}");
        $showRes->assertOk();
        $showRes->assertJsonPath('data.alert_requested', true);
        $showRes->assertJsonCount(2, 'data.public_media');

        // Test Organization Response
        $orgUser = User::factory()->create(['email_verified_at' => now()]);
        $business->update(['user_id' => $orgUser->id]);
        $resp = $this->actingAs($orgUser, 'sanctum')->postJson("/api/scam-cases/{$case->id}/subject-response", [
            'subject_response' => 'We contacted the customer and initiated replacement delivery.',
        ]);
        $resp->assertOk();
        $this->assertEquals('We contacted the customer and initiated replacement delivery.', $case->fresh()->subject_response);

        // Test Admin Toggle Alert
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $toggleRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/scam-cases/{$case->id}/alert", [
            'alert_enabled' => true,
        ]);
        $toggleRes->assertOk();
        $this->assertTrue((bool) $case->fresh()->alert_enabled);

        // Test Case Resolution
        $resolveRes = $this->actingAs($reporter, 'sanctum')->postJson("/api/scam-cases/{$case->id}/resolve", [
            'resolution_note' => 'Issue resolved after customer support intervention.',
        ]);
        $resolveRes->assertOk();
        $this->assertEquals('resolved', $case->fresh()->status);
        $this->assertNotNull($case->fresh()->resolved_at);
    }
}

