<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use Database\Seeders\SampleCommunityContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SampleCommunityContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_defaults_to_a_dry_run_without_creating_content(): void
    {
        $this->artisan('sample:community-content')->expectsOutputToContain('Dry run: nothing written.')->assertExitCode(0);
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('reviews', 0);
        $this->assertDatabaseCount('scam_cases', 0);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_sample_content_is_labelled_private_evidence_free_and_idempotent(): void
    {
        $this->seed(SampleCommunityContentSeeder::class);
        $review = Review::first();
        $review->update(['title' => 'Edited sample title that must be preserved']);
        $this->seed(SampleCommunityContentSeeder::class);

        $this->assertDatabaseCount('businesses', 8);
        $this->assertDatabaseCount('reviews', 150);
        $this->assertDatabaseCount('scam_cases', 24);
        $this->assertSame(8, Business::distinct()->count('location'));
        $this->assertSame('Edited sample title that must be preserved', $review->fresh()->title);
        $this->assertSame(8, Business::where('is_demo', true)->where('verified', false)->whereNull('user_id')->whereNull('source_ref')->whereNull('source_url')->count());
        $this->assertSame(150, Review::where('is_demo', true)->where('verified_experience', false)->whereNull('image_path')->whereNull('evidence_paths')->count());
        $this->assertSame(24, ScamCase::where('is_demo', true)->whereNull('amount')->whereNull('reviewed_by_user_id')->count());
        $this->assertDatabaseCount('scam_case_evidence', 0);
        $this->assertDatabaseCount('business_claims', 0);
        $this->assertSame(0, DB::table('users')->whereNotNull('password')->count());
        foreach (Review::all() as $item) {
            $this->assertStringContainsString('Fictional sample', $item->body);
            $this->assertNotEmpty($item->translations['bn']['body']);
            foreach ($item->public_media as $media) {
                $this->assertSame('illustration', $media['kind']);
                $this->assertStringStartsWith('/demo-media/', $media['url']);
            }
        }
        foreach (ScamCase::all() as $case) {
            $this->assertStringContainsString('Fictional sample', $case->public_summary);
            $this->assertTrue($case->review->is_demo);
            $this->assertSame($case->business_id, $case->review->business_id);
        }
    }

    public function test_reserved_slug_collision_rolls_back_without_touching_real_organizations(): void
    {
        $real = Business::create(['slug' => 'sample-community-v1-chattogram', 'name' => 'Existing organization', 'category' => 'Products', 'is_demo' => false, 'status' => 'approved']);
        try {
            (new SampleCommunityContentSeeder())->run();
            $this->fail('Expected sample collision to be refused.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('conflicts', $error->getMessage());
        }
        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('reviews', 0);
        $this->assertDatabaseCount('scam_cases', 0);
        $this->assertFalse($real->fresh()->is_demo);
        $this->assertSame('Existing organization', $real->fresh()->name);
    }
}
