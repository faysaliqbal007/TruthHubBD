<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use App\Models\BusinessProfileImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdvertisementApiTest extends TestCase
{
    use RefreshDatabase;

    private function creative(array $extra = []): array
    {
        return $extra + ['title_en'=>'Example creative','title_bn'=>'উদাহরণ বিজ্ঞাপন','body_en'=>'Clear public information about an offer.','body_bn'=>'প্রস্তাবের স্পষ্ট প্রকাশ্য তথ্য।',
            'bullets_en'=>['Read the full terms'],'bullets_bn'=>['সম্পূর্ণ শর্ত পড়ুন'],'sector'=>'education','decision_rationale'=>'private-advertisement-rationale-marker'];
    }

    private function ad(array $extra = []): Advertisement
    {
        return Advertisement::create($extra + $this->creative() + ['status'=>'published','image_source'=>'illustration','illustration_theme'=>'education','is_sample'=>false,'display_order'=>0]);
    }

    private function organization(array $extra = []): Business
    {
        return Business::create($extra + ['name'=>'Test organization','slug'=>'ad-organization-'.Business::count(),'category'=>'Products','status'=>'approved']);
    }

    public function test_admin_crud_and_recoverable_states_are_audited_without_changing_organization_data(): void
    {
        $organization = $this->organization(['rating'=>4.2,'review_count'=>10]);
        $before = $organization->fresh()->getAttributes();
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $response = $this->postJson('/api/admin/advertisements',$this->creative(['organization_id'=>$organization->id]))->assertCreated()->assertJsonPath('data.status','draft');
        $id = $response->json('data.id');
        $this->getJson('/api/advertisements')->assertOk()->assertJsonCount(0,'data');
        foreach (['published','paused','archived','draft','published'] as $status) {
            $this->patchJson('/api/admin/advertisements/'.$id,['status'=>$status,'decision_rationale'=>'Admin reviewed the creative and its display state.'])->assertOk()->assertJsonPath('data.status',$status);
            $this->getJson('/api/advertisements')->assertJsonCount($status==='published'?1:0,'data');
        }
        $this->patchJson('/api/admin/advertisements/'.$id,['title_en'=>'Updated public title','decision_rationale'=>'Reviewed the amended advertisement wording.'])->assertOk();
        $this->getJson('/api/admin/advertisements?status=published&sector=education')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.title_en','Updated public title');
        $this->assertSame($before,$organization->fresh()->getAttributes());
        $this->assertDatabaseCount('sponsored_campaigns',0);
        $this->assertSame(7,DB::table('audit_logs')->where('auditable_type',Advertisement::class)->count());
        $this->deleteJson('/api/admin/advertisements/'.$id)->assertStatus(405);
        $this->assertDatabaseHas('advertisements',['id'=>$id]);
    }

    public function test_guests_users_moderators_unverified_admins_and_staff_without_mfa_cannot_manage_ads(): void
    {
        $ad = $this->ad();
        $this->getJson('/api/admin/advertisements')->assertUnauthorized();
        $this->postJson('/api/admin/advertisements',$this->creative())->assertUnauthorized();
        $this->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>'archived'])->assertUnauthorized();
        foreach (['user','moderator'] as $role) {
            $this->actingAs(User::factory()->create(['role'=>$role]));
            $this->getJson('/api/admin/advertisements')->assertForbidden();
            $this->postJson('/api/admin/advertisements',$this->creative())->assertForbidden();
            $this->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>'archived'])->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role'=>'admin','email_verified_at'=>null]))->getJson('/api/admin/advertisements')->assertForbidden();
        config(['trust.staff_mfa_required'=>true]);
        $this->actingAs(User::factory()->create(['role'=>'admin']))->getJson('/api/admin/advertisements')->assertForbidden()->assertJsonPath('requires_mfa',true);
        $this->assertDatabaseCount('advertisements',1);
        $this->assertSame('published',$ad->fresh()->status);
    }

    public function test_public_listing_enforces_schedules_approval_filters_order_and_private_field_redaction(): void
    {
        $this->travelTo(now()->startOfSecond());
        $now = now();
        $old = $this->ad(['display_order'=>2,'starts_at'=>$now->copy()->subHour(),'ends_at'=>$now->copy()->addHour()]);
        $first = $this->ad(['display_order'=>1,'sector'=>'healthcare']);
        $tie = $this->ad(['display_order'=>2]);
        foreach (['draft','paused','archived'] as $status) $this->ad(['status'=>$status,'title_en'=>'hidden-ad-marker']);
        $this->ad(['starts_at'=>$now->copy()->addSecond(),'title_en'=>'hidden-ad-marker']);
        $this->ad(['ends_at'=>$now,'title_en'=>'hidden-ad-marker']);
        $this->ad(['organization_id'=>$this->organization(['status'=>'pending'])->id,'title_en'=>'hidden-ad-marker']);
        $response = $this->getJson('/api/advertisements')->assertOk()->assertJsonCount(3,'data')->assertJsonPath('data.0.id',$first->id)->assertJsonPath('data.1.id',$tie->id)->assertJsonPath('data.2.id',$old->id)
            ->assertJsonMissingPath('data.0.decision_rationale')->assertJsonMissingPath('data.0.created_by_user_id')->assertJsonMissingPath('data.0.status')->assertJsonMissingPath('data.0.sample_key')->assertDontSee('private-advertisement')->assertDontSee('hidden-ad-marker');
        $this->assertSame($now->copy()->subHour()->toISOString(),$response->json('data.2.starts_at'));
        $this->getJson('/api/advertisements?sector=healthcare')->assertJsonCount(1,'data')->assertJsonPath('data.0.id',$first->id);
        $this->getJson('/api/advertisements?sector=unknown')->assertOk()->assertJsonCount(0,'data');
    }

    public function test_field_limits_blank_values_bullets_schedule_and_sample_spoofing_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        foreach ([['title_en'=>str_repeat('a',141)],['body_bn'=>str_repeat('অ',1001)],['title_bn'=>' '],['decision_rationale'=>'short'],
            ['bullets_en'=>['one','two','three','four']],['bullets_bn'=>[' ']],['bullets_en'=>['named'=>'value']],['display_order'=>-1],['display_order'=>10001],
            ['starts_at'=>now()->toISOString(),'ends_at'=>now()->subHour()->toISOString()],['is_sample'=>true],['is_sample'=>null],['sample_key'=>'sample-fake'],['status'=>'deleted'],['sector'=>str_repeat('s',101)],['image_source'=>'private_upload']] as $invalid) {
            $this->postJson('/api/admin/advertisements',$this->creative($invalid))->assertUnprocessable()->assertJsonStructure(['message','errors']);
        }
        $ad = $this->ad(['starts_at'=>now(),'ends_at'=>now()->addHour()]);
        $this->patchJson('/api/admin/advertisements/'.$ad->id,['starts_at'=>now()->addDays(2)->toISOString(),'decision_rationale'=>'An invalid partial schedule change.'])->assertUnprocessable()->assertJsonValidationErrors('ends_at');
        $this->assertDatabaseCount('advertisements',1);
    }

    public function test_destination_urls_require_safe_public_https_hosts_and_are_never_fetched(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        foreach (['javascript:alert(1)','http://example.com/offer','https://user:pass@example.com/','https://localhost/','https://127.0.0.1/','https://[::1]/','https://2130706433/','https://site.internal/','https://site.local/','https://site.test/','https://example.com:8443/','https://example.com\\@localhost/','https://example.com/%0d%0aLocation:bad'] as $url) {
            $this->postJson('/api/admin/advertisements',$this->creative(['destination_url'=>$url]))->assertUnprocessable()->assertJsonValidationErrors('destination_url');
        }
        $this->postJson('/api/admin/advertisements',$this->creative(['destination_url'=>'https://EXAMPLE.com/offer?q=course#details']))->assertCreated()->assertJsonPath('data.destination_url','https://example.com/offer?q=course#details');
        $this->assertDatabaseCount('advertisements',1);
    }

    public function test_organization_association_requires_approval_and_demo_association_forces_sample_label(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        foreach (['pending','rejected'] as $status) {
            $business = $this->organization(['status'=>$status]);
            $this->postJson('/api/admin/advertisements',$this->creative(['organization_id'=>$business->id]))->assertUnprocessable()->assertJsonValidationErrors('organization_id');
        }
        $demo = $this->organization(['is_demo'=>true]);
        $response = $this->postJson('/api/admin/advertisements',$this->creative(['organization_id'=>$demo->id,'status'=>'published']))->assertCreated()->assertJsonPath('data.is_sample',true);
        $this->getJson('/api/advertisements')->assertJsonPath('data.0.is_sample',true)->assertJsonPath('data.0.label','Advertisement')->assertJsonPath('data.0.organization.url','/business/'.$demo->slug);
        $real = $this->organization();
        $this->patchJson('/api/admin/advertisements/'.$response->json('data.id'),['organization_id'=>$real->id,'decision_rationale'=>'Reassociation must not imply fictional offers are real.'])->assertUnprocessable()->assertJsonValidationErrors('organization_id');
        $demo->update(['status'=>'rejected']);
        $this->getJson('/api/advertisements')->assertJsonCount(0,'data');
    }

    public function test_only_approved_consented_profile_photos_are_used_and_revoked_images_fall_back_to_illustrations(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $business = $this->organization();
        $payload = $this->creative(['status'=>'published','organization_id'=>$business->id,'image_source'=>'organization_photo']);
        $this->postJson('/api/admin/advertisements',$payload)->assertUnprocessable()->assertJsonValidationErrors('image_source');
        $image = BusinessProfileImage::create(['business_id'=>$business->id,'uploaded_by_user_id'=>User::first()->id,'storage_path'=>'organization-images/private-ad-photo.jpg','mime_type'=>'image/jpeg','bytes'=>100,'sha256'=>str_repeat('a',64),'publication_consent'=>true,'status'=>'approved']);
        $this->postJson('/api/admin/advertisements',$payload)->assertCreated();
        $this->getJson('/api/advertisements')->assertJsonPath('data.0.image.kind','photo')->assertJsonPath('data.0.image.url','/api/businesses/'.$business->id.'/profile-image')->assertDontSee('private-ad-photo')->assertDontSee('sha256');
        $image->update(['status'=>'rejected']);
        $this->getJson('/api/advertisements')->assertJsonPath('data.0.image.kind','illustration')->assertJsonPath('data.0.image.url','/advertisement-media/education.svg');
    }

    public function test_supplied_creative_paths_are_persisted_and_arbitrary_or_private_images_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        foreach ([null,'/storage/private/ownership.jpg','https://example.com/tracking.jpg','/advertisement-media/unknown.jpg'] as $path) {
            $this->postJson('/api/admin/advertisements',$this->creative(['image_source'=>'creative_image','creative_image_path'=>$path]))->assertUnprocessable()->assertJsonValidationErrors('creative_image_path');
        }
        $path='/advertisement-media/reference-education.jpg';
        $response=$this->postJson('/api/admin/advertisements',$this->creative(['status'=>'published','image_source'=>'creative_image','creative_image_path'=>$path]))->assertCreated();
        $this->assertDatabaseHas('advertisements',['id'=>$response->json('data.id'),'creative_image_path'=>$path,'destination_url'=>null]);
        $this->getJson('/api/advertisements')->assertJsonPath('data.0.image.kind','creative')->assertJsonPath('data.0.image.url',$path)->assertJsonPath('data.0.destination_url',null)->assertDontSee('private-advertisement-rationale-marker');
        $this->patchJson('/api/admin/advertisements/'.$response->json('data.id'),['creative_image_path'=>'/advertisement-media/reference-recruitment.jpg','decision_rationale'=>'Admin selected a different supplied creative.'])->assertOk();
        $this->getJson('/api/advertisements')->assertJsonPath('data.0.image.url','/advertisement-media/reference-recruitment.jpg');
    }

    public function test_pause_and_archive_remain_available_after_publication_dependencies_are_revoked(): void
    {
        $organization=$this->organization();
        $image=BusinessProfileImage::create(['business_id'=>$organization->id,'storage_path'=>'private-fixture-image','mime_type'=>'image/png','bytes'=>1,'sha256'=>str_repeat('a',64),'status'=>'approved','publication_consent'=>true]);
        $ad=$this->ad(['organization_id'=>$organization->id,'image_source'=>'organization_photo']);
        $organization->update(['status'=>'rejected']);
        $image->update(['status'=>'revoked','publication_consent'=>false]);
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        foreach (['paused','archived'] as $status) $this->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>$status,'decision_rationale'=>'Fixture publication consent has been withdrawn.'])->assertOk()->assertJsonPath('data.status',$status);
        $this->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>'published','decision_rationale'=>'Fixture must not republish invalid dependencies.'])->assertUnprocessable()->assertJsonValidationErrors(['organization_id','image_source']);
        $this->assertSame('archived',$ad->fresh()->status);
        $this->assertDatabaseCount('audit_logs',2);
        $this->getJson('/api/advertisements')->assertOk()->assertJsonCount(0,'data');
    }

    public function test_audit_failure_rolls_back_content_and_state_change(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $ad = $this->ad(['status'=>'draft']);
        $before = $ad->fresh()->getAttributes();
        DB::listen(function ($query) {
            if (str_contains(strtolower($query->sql),'insert') && str_contains($query->sql,'audit_logs')) throw new \RuntimeException('Simulated audit failure.');
        });
        $this->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>'published','title_en'=>'Must roll back','decision_rationale'=>'private-advertisement-rationale-marker'])->assertStatus(500);
        $this->assertSame($before,$ad->fresh()->getAttributes());
        $this->assertDatabaseCount('audit_logs',0);
    }

    public function test_authenticated_users_report_visible_ads_without_organization_and_hidden_targets_return_generic_not_found(): void
    {
        $ad = $this->ad();
        $payload = ['reportable_type'=>'advertisement','reportable_id'=>$ad->id,'reason'=>'Misleading information','details'=>'Please review this advertisement.'];
        $this->postJson('/api/reports',$payload)->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/reports',$payload)->assertCreated();
        $this->assertDatabaseHas('content_reports',['reportable_type'=>'advertisement','reportable_id'=>$ad->id,'status'=>'open']);
        foreach ([['status'=>'draft'],['status'=>'paused'],['status'=>'archived'],['starts_at'=>now()->addHour()],['ends_at'=>now()->subHour()]] as $state) {
            $hidden = $this->ad($state+['title_en'=>'hidden-ad-marker']);
            $this->postJson('/api/reports',array_replace($payload,['reportable_id'=>$hidden->id]))->assertNotFound()->assertDontSee('hidden-ad-marker');
        }
        $this->postJson('/api/reports',array_replace($payload,['reportable_id'=>PHP_INT_MAX]))->assertNotFound();
        $this->assertDatabaseCount('content_reports',1);
    }

    public function test_iso_offsets_are_normalized_to_application_timezone_and_public_schedule_times_remain_utc_iso(): void
    {
        $this->travelTo(\Carbon\Carbon::parse('2026-10-01T10:00:00Z'));
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $response = $this->postJson('/api/admin/advertisements',$this->creative(['status'=>'published','starts_at'=>'2026-10-01T15:00:00+06:00','ends_at'=>'2026-10-01T11:00:00Z']))->assertCreated();
        $id = $response->json('data.id');
        $this->assertDatabaseHas('advertisements',['id'=>$id,'starts_at'=>'2026-10-01 15:00:00','ends_at'=>'2026-10-01 17:00:00']);
        $this->getJson('/api/advertisements')->assertJsonCount(1,'data')->assertJsonPath('data.0.starts_at','2026-10-01T09:00:00.000000Z')->assertJsonPath('data.0.ends_at','2026-10-01T11:00:00.000000Z');
        $this->travelTo(\Carbon\Carbon::parse('2026-10-01T11:00:00Z'));
        $this->getJson('/api/advertisements')->assertJsonCount(0,'data');
    }
}
