<?php
namespace Tests\Feature;
use App\Models\{Business,Review,ScamCase,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class ModerationHistoryTest extends TestCase{
 use RefreshDatabase;
 public function test_review_removal_and_restoration_are_staff_only_and_preserve_content():void{
  $u=User::factory()->create();$b=Business::create(['name'=>'Entity','slug'=>'entity','category'=>'Products','status'=>'approved']);$review=Review::create(['business_id'=>$b->id,'user_id'=>$u->id,'author'=>'Tester','title'=>'Experience','body'=>'Preserve this','rating'=>4,'status'=>'published']);
  $url='/api/moderation/content/review/'.$review->id;
  $this->actingAs($u)->patchJson($url,['status'=>'removed','reason'=>'Test'])->assertForbidden();
  $this->actingAs(User::factory()->create(['role'=>'moderator']))->patchJson($url,['status'=>'removed','reason'=>'Policy review'])->assertOk();
  $this->getJson('/api/reviews/'.$review->id)->assertNotFound();$this->assertSame('Preserve this',$review->fresh()->body);
  $this->patchJson($url,['status'=>'published','reason'=>'Appeal accepted'])->assertOk();$this->getJson('/api/reviews/'.$review->id)->assertOk();$this->assertDatabaseHas('audit_logs',['action'=>'content.published']);
 }
 public function test_public_case_timeline_and_reporter_notification_do_not_expose_private_reason():void{
  $u=User::factory()->create();$b=Business::create(['name'=>'Entity','slug'=>'entity','category'=>'Products']);$case=ScamCase::create(['case_code'=>'HISTORY-1','business_id'=>$b->id,'reporter_user_id'=>$u->id,'title'=>'Private','summary'=>'Private']);
  $this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/moderation/scam-cases/'.$case->id,['status'=>'published','public_summary'=>'Redacted summary','decision_rationale'=>'secret-internal-note'])->assertOk();
  $this->getJson('/api/scam-cases/HISTORY-1')->assertJsonCount(1,'data.events')->assertDontSee('secret-internal-note');
  $this->assertDatabaseHas('notifications',['user_id'=>$u->id,'type'=>'case_update']);
  $this->actingAs(User::factory()->create(['role'=>'moderator']))->patchJson('/api/moderation/scam-cases/'.$case->id,['status'=>'resolved'])->assertForbidden();
 }
}
