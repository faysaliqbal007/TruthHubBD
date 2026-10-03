<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Support\PublicMedia;
use Database\Seeders\SampleCommunityContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SampleCommunityMediaTest extends TestCase
{
    use RefreshDatabase;

    private function oldImage(): array
    {
        return ['url'=>'/demo-media/delivery.svg','alt'=>'Fictional sample delivery illustration','kind'=>'illustration','caption'=>'Fictional sample illustration, not submitted evidence.','approved_for_public'=>true];
    }

    private function sampleReview(int $number): Review
    {
        return Review::where('disclaimer','like','SAMPLE-COMMUNITY-V1-'.str_pad((string)$number,3,'0',STR_PAD_LEFT).':%')->firstOrFail();
    }

    public function test_ai_asset_is_public_only_on_demo_records_and_cannot_be_relabelled_as_a_real_photo(): void
    {
        $media = SampleCommunityContentSeeder::shopIllustration();
        $this->assertCount(1,PublicMedia::visible([$media],true));
        $this->assertSame([],PublicMedia::visible([$media],false));
        $this->assertSame([],PublicMedia::visible([array_replace($media,['kind'=>'photo','redacted'=>true,'consent_confirmed'=>true])],false));
        $this->assertSame([],PublicMedia::visible([array_replace($media,['url'=>PublicMedia::SAMPLE_SHOP_ILLUSTRATION.'?tracking=1'])],true));
        $this->assertStringContainsString('AI-created',$media['caption']);
        $this->assertStringContainsString('No real organization',$media['caption']);
    }

    public function test_preview_writes_nothing_and_apply_changes_only_one_legacy_image_field_idempotently(): void
    {
        $this->seed(SampleCommunityContentSeeder::class);
        $review = $this->sampleReview(9);
        $case = ScamCase::where('case_code','SAMPLE-V1-009')->firstOrFail();
        $second = ['url'=>'/demo-media/parcel.svg','alt'=>'Fictional sample parcel illustration','kind'=>'illustration','caption'=>'Fictional sample illustration, not submitted evidence.','approved_for_public'=>true];
        $review->update(['title'=>'Preserve edited sample text','status'=>'under_review','public_media'=>[$this->oldImage(),$second]]);
        $case->update(['public_summary'=>'Preserve reviewed summary','admin_reviewed_at'=>now(),'alert_enabled'=>true,'public_media'=>[$this->oldImage(),$second]]);
        $reviewBefore = $review->fresh()->getAttributes();
        $caseBefore = $case->fresh()->getAttributes();
        $counts = [Business::count(),Review::count(),ScamCase::count()];
        $this->artisan('sample:community-media')->expectsOutputToContain('Dry run: nothing written.')->assertExitCode(0);
        $this->assertSame($reviewBefore,$review->fresh()->getAttributes());
        $this->assertSame($caseBefore,$case->fresh()->getAttributes());
        $this->artisan('sample:community-media --apply')->assertExitCode(0);
        foreach ([[$review,$reviewBefore],[$case,$caseBefore]] as [$record,$before]) {
            $after = $record->fresh()->getAttributes();
            $this->assertSame(array_diff_key($before,['public_media'=>true]),array_diff_key($after,['public_media'=>true]));
            $raw = json_decode($record->fresh()->getRawOriginal('public_media'),true);
            $this->assertCount(2,$raw);
            $this->assertSame(SampleCommunityContentSeeder::shopIllustration(),$raw[0]);
            $this->assertSame($second,$raw[1]);
        }
        $after = [$review->fresh()->getAttributes(),$case->fresh()->getAttributes()];
        $this->artisan('sample:community-media --apply')->expectsOutputToContain('0 reviews, 0 cases')->assertExitCode(0);
        $this->assertSame($after,[$review->fresh()->getAttributes(),$case->fresh()->getAttributes()]);
        $this->assertSame($counts,[Business::count(),Review::count(),ScamCase::count()]);
        $this->assertDatabaseCount('jobs',0);
        $this->assertDatabaseCount('notifications',0);
    }

    public function test_no_image_variants_custom_galleries_real_records_and_other_sectors_are_preserved(): void
    {
        $this->seed(SampleCommunityContentSeeder::class);
        $none = $this->sampleReview(1);
        $noneCase = ScamCase::where('case_code','SAMPLE-V1-001')->firstOrFail();
        $custom = $this->sampleReview(9);
        $custom->update(['public_media'=>[['url'=>'/public-media/approved-photo.jpg','alt'=>'Existing approved photo','kind'=>'photo','approved_for_public'=>true,'redacted'=>true,'consent_confirmed'=>true]]]);
        $real = $this->sampleReview(17); $real->update(['is_demo'=>false,'public_media'=>[$this->oldImage()]]);
        $clinic = $this->sampleReview(2); $clinic->update(['public_media'=>[$this->oldImage()]]);
        $rawBefore = DB::table('reviews')->whereIn('id',[$none->id,$custom->id,$real->id,$clinic->id])->orderBy('id')->get()->toJson();
        $caseBefore = $noneCase->getAttributes();
        $this->artisan('sample:community-media --apply')->assertExitCode(0);
        $this->assertSame($rawBefore,DB::table('reviews')->whereIn('id',[$none->id,$custom->id,$real->id,$clinic->id])->orderBy('id')->get()->toJson());
        $this->assertSame($caseBefore,$noneCase->fresh()->getAttributes());
        $this->assertSame([],$none->fresh()->public_media);
        $this->assertSame([],$real->fresh()->public_media);
    }

    public function test_command_refuses_production_and_never_creates_missing_sample_records(): void
    {
        $this->artisan('sample:community-media --apply')->expectsOutputToContain('0 reviews, 0 cases')->assertExitCode(0);
        $this->assertDatabaseCount('businesses',0);
        $this->assertDatabaseCount('reviews',0);
        $this->assertDatabaseCount('scam_cases',0);
        $this->app->instance('env','production');
        $this->artisan('sample:community-media --apply')->expectsOutputToContain('restricted to local/testing')->assertExitCode(1);
        $this->assertDatabaseCount('reviews',0);
    }
}
