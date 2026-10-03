<?php
namespace Tests\Feature;

use App\Models\{Business, Review, ScamCase, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Storage};
use Tests\TestCase;

class OperationsTest extends TestCase
{
    use RefreshDatabase;
    public function test_saved_state_is_persistent_and_scoped_to_current_user():void {
        $b=$this->entity();$owner=User::factory()->create();
        $this->getJson('/api/businesses/'.$b->id.'/saved')->assertUnauthorized();
        $this->actingAs($owner)->getJson('/api/businesses/'.$b->id.'/saved')->assertOk()->assertJsonPath('saved',false);
        $this->putJson('/api/businesses/'.$b->id.'/saved',['saved'=>true])->assertOk();
        $this->getJson('/api/businesses/'.$b->id.'/saved')->assertJsonPath('saved',true);
        $this->actingAs(User::factory()->create())->getJson('/api/businesses/'.$b->id.'/saved')->assertJsonPath('saved',false);
        $this->actingAs($owner)->putJson('/api/businesses/'.$b->id.'/saved',['saved'=>false])->assertOk();
        $this->getJson('/api/businesses/'.$b->id.'/saved')->assertJsonPath('saved',false);
    }

    private function entity(string $slug = 'entity'): Business {
        return Business::create(['name'=>$slug, 'slug'=>$slug, 'category'=>'Products', 'status'=>'approved']);
    }
    private function review(Business $business, User $user): Review {
        return Review::create(['business_id'=>$business->id,'user_id'=>$user->id,'author'=>$user->name,'rating'=>4,'title'=>'Original','body'=>'Original experience','status'=>'published']);
    }
    public function test_review_edits_preserve_history_and_reject_other_authors(): void {
        $owner=User::factory()->create(); $b=$this->entity(); $review=$this->review($b,$owner);
        $payload=['title'=>'Updated','body'=>'Updated experience','rating'=>2];
        $this->actingAs(User::factory()->create())->patchJson('/api/reviews/'.$review->id,$payload)->assertForbidden();
        $this->actingAs($owner)->patchJson('/api/reviews/'.$review->id,$payload)->assertOk();
        $this->assertDatabaseHas('review_versions',['review_id'=>$review->id,'editor_user_id'=>$owner->id]);
        $this->assertSame('Original',json_decode(DB::table('review_versions')->first()->snapshot,true)['title']);
        $this->assertEquals(2,$b->fresh()->rating);
    }
    public function test_official_responses_require_verified_representation(): void {
        $owner=User::factory()->create(); $b=$this->entity(); $b->update(['user_id'=>$owner->id]); $review=$this->review($b,User::factory()->create());
        $this->actingAs($owner)->putJson('/api/reviews/'.$review->id.'/official-response',['body'=>'Our response'])->assertForbidden();
        $b->update(['verified'=>true]);
        $this->putJson('/api/reviews/'.$review->id.'/official-response',['body'=>'Our response'])->assertOk();
        $this->getJson('/api/reviews/'.$review->id)->assertJsonPath('data.official_response.body','Our response');
    }
    public function test_merge_retains_review_and_old_profile_resolves_to_canonical(): void {
        $source=$this->entity('duplicate'); $target=$this->entity('canonical'); $review=$this->review($source,User::factory()->create());
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->postJson('/api/admin/businesses/'.$source->id.'/merge',['target_id'=>$target->id,'reason'=>'Same branch'])->assertForbidden();
        $this->actingAs(User::factory()->create(['role'=>'admin']))->postJson('/api/admin/businesses/'.$source->id.'/merge',['target_id'=>$target->id,'reason'=>'Same branch'])->assertOk();
        $this->assertSame($target->id,$review->fresh()->business_id);
        $this->getJson('/api/businesses/duplicate')->assertJsonPath('data.slug','canonical');
        $this->assertDatabaseHas('audit_logs',['action'=>'entity.merged','auditable_id'=>$source->id]);
    }
    public function test_private_evidence_requires_staff_and_access_is_audited(): void {
        Storage::fake('private'); Storage::disk('private')->put('case/proof.pdf','private proof');
        $user=User::factory()->create(); $b=$this->entity();
        $case=ScamCase::create(['case_code'=>'PRIVATE-1','business_id'=>$b->id,'reporter_user_id'=>$user->id,'title'=>'Private','summary'=>'Private']);
        $evidence=$case->evidence()->create(['uploaded_by_user_id'=>$user->id,'storage_path'=>'case/proof.pdf','mime_type'=>'application/pdf','is_private'=>true]);
        $this->actingAs($user)->get('/api/moderation/evidence/'.$evidence->id)->assertForbidden();
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->get('/api/moderation/evidence/'.$evidence->id)->assertOk();
        $this->assertDatabaseHas('audit_logs',['action'=>'evidence.accessed','auditable_id'=>$case->id]);
    }
    public function test_case_followups_are_scoped_and_subject_response_stays_private(): void {
        Storage::fake('private'); $reporter=User::factory()->create(); $owner=User::factory()->create(); $b=$this->entity(); $b->update(['user_id'=>$owner->id,'verified'=>true]);
        $case=ScamCase::create(['case_code'=>'FOLLOWUP-1','business_id'=>$b->id,'reporter_user_id'=>$reporter->id,'title'=>'Private title','summary'=>'Private report','status'=>'needs_evidence']);
        $file=\Illuminate\Http\UploadedFile::fake()->create('proof.pdf',10,'application/pdf');
        $this->actingAs($owner)->postJson('/api/scam-cases/'.$case->id.'/evidence',['evidence'=>[$file]])->assertForbidden();
        $this->actingAs($reporter)->postJson('/api/scam-cases/'.$case->id.'/evidence',['evidence'=>[$file]])->assertCreated();
        $this->assertSame('under_review',$case->fresh()->status);
        $case->update(['status'=>'published','published_at'=>now(),'public_summary'=>'Public summary']);
        $this->postJson('/api/scam-cases/'.$case->id.'/subject-response',['subject_response'=>'Private response'])->assertForbidden();
        $this->actingAs($owner)->postJson('/api/scam-cases/'.$case->id.'/subject-response',['subject_response'=>'Private response'])->assertOk();
        $this->getJson('/api/scam-cases/FOLLOWUP-1')->assertJsonPath('data.status','disputed')->assertDontSee('Private response');
    }
}
