<?php
namespace Tests\Feature;
use App\Models\{Business,User,BusinessClaim,ScamCase};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB,Storage};
use Tests\TestCase;
class DocumentRetentionTest extends TestCase {
 use RefreshDatabase;
 public function test_dry_run_preserves_files_and_apply_respects_holds_and_appeals():void {
  Storage::fake('private');$user=User::factory()->create();$b=Business::create(['name'=>'Retention test','slug'=>'retention-test','category'=>'Products']);
  $claim=BusinessClaim::create(['business_id'=>$b->id,'user_id'=>$user->id,'representative_name'=>'Test','role_title'=>'Owner','contact_phone'=>'01000000000','status'=>'rejected','evidence_path'=>'claim.pdf','business_photo_path'=>'photo.png']);
  DB::table('business_claims')->where('id',$claim->id)->update(['updated_at'=>now()->subDays(100)]);
  foreach(['claim.pdf','photo.png','case.pdf','hold.pdf'] as $path)Storage::disk('private')->put($path,'fictional');
  $case=ScamCase::create(['case_code'=>'RETENTION','business_id'=>$b->id,'reporter_user_id'=>$user->id,'title'=>'Test','summary'=>'Test','status'=>'resolved','resolved_at'=>now()->subDays(190)]);
  $case->evidence()->create(['uploaded_by_user_id'=>$user->id,'storage_path'=>'case.pdf','mime_type'=>'application/pdf','is_private'=>true]);
  $held=ScamCase::create(['case_code'=>'HELD','business_id'=>$b->id,'reporter_user_id'=>$user->id,'title'=>'Test','summary'=>'Test','status'=>'resolved','resolved_at'=>now()->subDays(190)]);
  $held->legal_hold=true;$held->save();$held->evidence()->create(['uploaded_by_user_id'=>$user->id,'storage_path'=>'hold.pdf','mime_type'=>'application/pdf','is_private'=>true]);
  $this->actingAs($user)->postJson('/api/scam-cases/'.$case->id.'/appeals',['reason'=>'Please review'])->assertCreated();
  $this->postJson('/api/scam-cases/'.$case->id.'/appeals',['reason'=>'Duplicate'])->assertConflict();
  $this->actingAs(User::factory()->create())->postJson('/api/scam-cases/'.$case->id.'/appeals',['reason'=>'Not my case'])->assertForbidden();
  $this->artisan('documents:prune')->assertSuccessful();Storage::disk('private')->assertExists('claim.pdf');
  $this->artisan('documents:prune --apply')->assertSuccessful();
  Storage::disk('private')->assertMissing('claim.pdf');Storage::disk('private')->assertMissing('photo.png');Storage::disk('private')->assertExists('case.pdf');Storage::disk('private')->assertExists('hold.pdf');
  $this->assertNull($claim->fresh()->evidence_path);$this->assertDatabaseHas('audit_logs',['action'=>'retention.documents_deleted','auditable_id'=>$claim->id]);
  $appeal=DB::table('appeals')->first();
  $this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/admin/appeals/'.$appeal->id,['status'=>'affirmed','decision_note'=>'Review completed'])->assertOk();
  $this->artisan('documents:prune --apply')->assertSuccessful();Storage::disk('private')->assertMissing('case.pdf');Storage::disk('private')->assertExists('hold.pdf');$this->assertDatabaseCount('scam_cases',2);
 }
}
