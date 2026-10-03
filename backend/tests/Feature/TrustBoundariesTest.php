<?php
namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TrustBoundariesTest extends TestCase
{
    use RefreshDatabase;
    private function entity(): Business { return Business::create(['name'=>'Test Entity','slug'=>'test-entity','category'=>'Products','status'=>'approved']); }
    private function review(Business $b, ?User $u=null): Review { return Review::create(['business_id'=>$b->id,'user_id'=>$u?->id,'author'=>'Demo author','rating'=>4,'title'=>'My experience','body'=>'A detailed experience','status'=>'published']); }

    public function test_public_case_responses_do_not_expose_private_fields(): void {
        $u=User::factory()->create();$b=$this->entity();
        $case=ScamCase::create(['case_code'=>'TEST-1','business_id'=>$b->id,'reporter_user_id'=>$u->id,'title'=>'Secret title with identifier','summary'=>'Private receipt 99999','public_summary'=>'Redacted summary','status'=>'published','published_at'=>now(),'decision_rationale'=>'Private internal reasoning']);
        $this->getJson('/api/scam-cases/TEST-1')->assertOk()->assertJsonPath('data.summary','Redacted summary')->assertJsonMissingPath('data.reporter_user_id')->assertJsonMissingPath('data.decision_rationale')->assertDontSee('99999');
        $case->update(['status'=>'submitted','published_at'=>null]);
        $this->getJson('/api/scam-cases/TEST-1')->assertNotFound();
    }
    public function test_review_is_decoupled_from_scam_cases_and_attachments_are_public(): void {
        Storage::fake('public');$u=User::factory()->create();$b=$this->entity();
        $r=$this->actingAs($u)->postJson('/api/businesses/'.$b->id.'/reviews',['rating'=>4,'title'=>'Delivery experience','body'=>'Order arrived late','request_scam_alert'=>true,'file'=>UploadedFile::fake()->create('receipt.pdf',10,'application/pdf')])->assertCreated();
        $this->assertDatabaseCount('scam_cases', 0);
        $review=Review::first();
        $this->assertEquals('published', $review->status);
        $this->assertNotNull($review->image_path);
    }
    public function test_comments_work_for_seeded_reviews_and_replies_cannot_cross_reviews(): void {
        $u=User::factory()->create();$b=$this->entity();$a=$this->review($b);$other=$this->review($b);
        $r=$this->actingAs($u)->postJson('/api/reviews/'.$a->id.'/comments',['body'=>'Helpful detail'])->assertCreated();
        $this->postJson('/api/reviews/'.$other->id.'/comments',['body'=>'Cross-review reply','parent_id'=>$r->json('data.id')])->assertUnprocessable();
    }
    public function test_notification_reads_are_scoped_to_owner(): void {
        $owner=User::factory()->create();$visitor=User::factory()->create();
        $id=\DB::table('notifications')->insertGetId(['user_id'=>$owner->id,'type'=>'test','title'=>'Private','body'=>'Private','created_at'=>now(),'updated_at'=>now()]);
        $this->actingAs($visitor)->getJson('/api/notifications')->assertJsonCount(0,'data');
        $this->patchJson('/api/notifications/'.$id.'/read')->assertNoContent();
        $this->assertDatabaseHas('notifications',['id'=>$id,'read_at'=>null]);
    }
    public function test_provisional_entity_does_not_grant_representation(): void {
        $u=User::factory()->create();
        $r=$this->actingAs($u)->postJson('/api/businesses',['name'=>'New place','category'=>'Products'])->assertCreated()->assertJsonPath('data.userId',null);
        $id=$r->json('data.id');
        $this->patchJson('/api/businesses/'.$id,['name'=>'Hijacked'])->assertForbidden();
        $this->postJson('/api/businesses/'.$id.'/reviews',['title'=>'My visit','body'=>'Firsthand experience','rating'=>4])->assertCreated();
    }
    public function test_sponsored_campaign_does_not_modify_rating_and_moderator_cannot_manage_it(): void {
        $b=$this->entity();$this->review($b);$before=$b->fresh()->rating;
        $payload=['business_id'=>$b->id,'placement'=>'search','category'=>'Products','starts_at'=>today()->toDateString(),'ends_at'=>today()->addDay()->toDateString(),'active'=>true];
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->postJson('/api/admin/campaigns',$payload)->assertForbidden();
        $this->actingAs(User::factory()->create(['role'=>'admin']))->postJson('/api/admin/campaigns',$payload)->assertCreated();
        $this->assertEquals($before,$b->fresh()->rating);
        $this->getJson('/api/sponsored?category=Products&placement=search')->assertJsonCount(1,'data');
        $this->getJson('/api/sponsored?category=Healthcare&placement=search')->assertJsonCount(0,'data');
    }
    public function test_unverified_user_cannot_post_and_repeated_vote_does_not_inflate_count(): void {
        $b=$this->entity();$review=$this->review($b);
        $this->actingAs(User::factory()->create(['email_verified_at'=>null]))->postJson('/api/reviews/'.$review->id.'/comments',['body'=>'Not allowed'])->assertForbidden();
        $this->actingAs(User::factory()->create());
        $this->putJson('/api/reviews/'.$review->id.'/reaction',['type'=>'helpful'])->assertJsonPath('helpful_count',1);
        $this->putJson('/api/reviews/'.$review->id.'/reaction',['type'=>'helpful'])->assertJsonPath('helpful_count',0)->assertJsonPath('viewer_reaction',null);
    }
}
