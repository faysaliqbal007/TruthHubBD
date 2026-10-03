<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use Database\Seeders\SampleCommunityContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SampleAdvertisementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_dry_runs_and_creates_exactly_three_rich_labelled_examples_idempotently_without_fake_actions(): void
    {
        $this->artisan('sample:advertisements')->expectsOutputToContain('Dry run: nothing written.')->assertExitCode(0);
        $this->assertDatabaseCount('advertisements',0);
        $this->artisan('sample:advertisements --apply')->expectsOutputToContain('Created 3')->assertExitCode(0);
        $this->assertDatabaseCount('advertisements',3);
        $this->assertDatabaseCount('businesses',0);
        $this->assertDatabaseCount('users',0);
        foreach (Advertisement::all() as $ad) {
            $this->assertTrue($ad->is_sample);
            $this->assertNull($ad->organization_id);
            $this->assertNull($ad->destination_url);
            $this->assertCount(3,$ad->bullets_en);
            $this->assertCount(3,$ad->bullets_bn);
            $this->assertNotEmpty($ad->title_bn);
            $this->assertSame('illustration',$ad->image_source);
        }
        $edited = Advertisement::first();
        $edited->update(['title_en'=>'Preserve admin text','status'=>'paused','starts_at'=>now()->addDays(2)]);
        $before = $edited->getAttributes();
        $this->artisan('sample:advertisements --apply')->expectsOutputToContain('Created 0')->assertExitCode(0);
        $this->assertDatabaseCount('advertisements',3);
        $this->assertSame($before,$edited->fresh()->getAttributes());
        $this->getJson('/api/advertisements')->assertOk()->assertJsonCount(2,'data')->assertJsonPath('data.0.is_sample',true)->assertJsonPath('data.0.label','Advertisement')->assertJsonPath('data.0.destination_url',null);
        $this->assertDatabaseCount('sponsored_campaigns',0);
        $this->assertDatabaseCount('notifications',0);
    }

    public function test_associations_use_only_existing_approved_reserved_fictional_entities_and_preserve_all_records(): void
    {
        $this->seed(SampleCommunityContentSeeder::class);
        $before = Business::orderBy('id')->get()->toJson();
        $this->artisan('sample:advertisements --apply')->assertExitCode(0);
        $this->assertSame($before,Business::orderBy('id')->get()->toJson());
        $this->assertSame(3,Advertisement::whereNotNull('organization_id')->count());
        foreach (Advertisement::with('organization')->get() as $ad) $this->assertTrue($ad->organization->is_demo);
    }

    public function test_reference_creatives_store_exact_local_images_with_empty_urls_and_preserve_admin_changes(): void
    {
        $this->artisan('sample:advertisements --apply')->assertExitCode(0);
        $this->artisan('sample:advertisement-reference')->expectsOutputToContain('Dry run; nothing written.')->assertExitCode(0);
        $this->assertSame(0,Advertisement::whereNotNull('creative_image_path')->count());
        $this->artisan('sample:advertisement-reference --apply')->expectsOutputToContain('Updated 3')->assertExitCode(0);
        foreach(Advertisement::all() as $ad){
            $this->assertTrue($ad->is_sample);
            $this->assertNull($ad->destination_url);
            $this->assertNull($ad->organization_id);
            $this->assertSame('creative_image',$ad->image_source);
            $this->assertSame('/advertisement-media/reference-'.$ad->sector.'.jpg',$ad->creative_image_path);
        }
        $this->getJson('/api/advertisements')->assertJsonCount(3,'data')->assertJsonPath('data.0.image.kind','creative');
        $edited=Advertisement::first();$edited->update(['title_en'=>'Admin revised the supplied example','destination_url'=>'https://example.com/offer','status'=>'paused']);$before=$edited->fresh()->getAttributes();
        $this->artisan('sample:advertisement-reference --apply')->expectsOutputToContain('Updated 0')->assertExitCode(0);
        $this->assertSame($before,$edited->fresh()->getAttributes());
        $this->assertDatabaseCount('audit_logs',6);
        $this->assertDatabaseCount('users',0);
        $this->app->instance('env','production');
        $this->artisan('sample:advertisement-reference --apply')->assertExitCode(1);
        $this->assertSame($before,$edited->fresh()->getAttributes());
    }

    public function test_copy_polish_is_idempotent_and_preserves_admin_edits_example_labels_and_empty_urls(): void
    {
        $this->artisan('sample:advertisements --apply')->assertExitCode(0);
        $this->artisan('sample:advertisement-reference --apply')->assertExitCode(0);
        $edited=Advertisement::first();$edited->update(['updated_by_user_id'=>\App\Models\User::factory()->create(['role'=>'admin'])->id]);$before=$edited->fresh()->getAttributes();
        $this->artisan('sample:advertisement-copy')->expectsOutputToContain('Dry run; nothing written.')->assertExitCode(0);
        $this->artisan('sample:advertisement-copy --apply')->expectsOutputToContain('Polished 2')->assertExitCode(0);
        $this->assertSame($before,$edited->fresh()->getAttributes());
        foreach(Advertisement::all() as $ad){$this->assertTrue($ad->is_sample);$this->assertNull($ad->destination_url);}
        $this->artisan('sample:advertisement-copy --apply')->expectsOutputToContain('Polished 0')->assertExitCode(0);
        $this->app->instance('env','production');
        $this->artisan('sample:advertisement-copy --apply')->assertExitCode(1);
    }

    public function test_reference_update_skips_already_edited_samples(): void
    {
        $this->artisan('sample:advertisements --apply')->assertExitCode(0);
        $edited=Advertisement::first();$edited->update(['body_en'=>'Admin-edited content that must remain unchanged.']);
        $this->artisan('sample:advertisement-reference --apply')->assertExitCode(0);
        $this->assertSame('Admin-edited content that must remain unchanged.',$edited->fresh()->body_en);
    }

    public function test_production_writes_and_reserved_key_collision_are_refused_without_partial_creates(): void
    {
        $this->app->instance('env','production');
        $this->artisan('sample:advertisements --apply')->expectsOutputToContain('restricted to local/testing')->assertExitCode(1);
        $this->assertDatabaseCount('advertisements',0);
        $this->app->instance('env','testing');
        $real = Advertisement::create(['sample_key'=>'sample-advertisement-v1-healthcare','title_en'=>'Existing real creative','title_bn'=>'বিদ্যমান বিজ্ঞাপন','body_en'=>'Preserve text','body_bn'=>'লেখা সংরক্ষণ করুন','sector'=>'healthcare','is_sample'=>false,'decision_rationale'=>'Existing admin rationale.']);
        $before = $real->fresh()->getAttributes();
        $this->artisan('sample:advertisements --apply')->expectsOutputToContain('non-sample record')->assertExitCode(1);
        $this->assertDatabaseCount('advertisements',1);
        $this->assertSame($before,$real->fresh()->getAttributes());
        $this->assertDatabaseCount('audit_logs',0);
    }
}
