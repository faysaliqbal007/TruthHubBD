<?php
namespace Tests\Feature;
use App\Models\{Business,Review,ScamCase,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{DB,Storage};
use Tests\TestCase;
class MultipleAttachmentsTest extends TestCase {
 use RefreshDatabase;
 private function entity():Business {return Business::create(['name'=>'Upload test shop','slug'=>'upload-test','category'=>'Products','status'=>'approved','location'=>'Dhaka']);}
 private function images(int $count):array {return array_map(fn($i)=>UploadedFile::fake()->createWithContent('photo-'.$i.'.png',base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')),range(1,$count));}
 public function test_review_accepts_multiple_private_images_and_does_not_expose_paths():void {
  Storage::fake('private');$user=User::factory()->create();$b=$this->entity();
  $response=$this->actingAs($user)->post('/api/businesses/'.$b->id.'/reviews',['rating'=>4,'title'=>'Experience','body'=>'Useful details','evidence'=>$this->images(3)],['Accept'=>'application/json']);
  $response->assertCreated()->assertJsonMissingPath('data.evidence_paths')->assertJsonMissingPath('data.image_path');
  $review=Review::firstOrFail();$this->assertCount(3,$review->evidence_paths);foreach($review->evidence_paths as $e)Storage::disk('private')->assertExists($e['path']);
  $this->getJson('/api/reviews/'.$review->id)->assertJsonMissingPath('data.evidence_paths');
  $this->getJson('/api/businesses/upload-test')->assertJsonMissingPath('data.reviews.0.evidence_paths');
  $this->getJson('/api/moderation/reviews/'.$review->id.'/attachments/0')->assertForbidden();
  config(['trust.staff_mfa_required'=>false]);$staff=User::factory()->create(['role'=>'moderator']);$this->actingAs($staff);
  $this->getJson('/api/moderation/reviews/'.$review->id.'/attachments')->assertOk()->assertJsonCount(3,'data')->assertJsonMissingPath('data.0.path');
  $this->get('/api/moderation/reviews/'.$review->id.'/attachments/0')->assertOk();
  $this->assertDatabaseHas('audit_logs',['action'=>'review_evidence.accessed','auditable_id'=>$review->id]);
  $this->get('/api/moderation/reviews/'.$review->id.'/attachments/9')->assertNotFound();
 }
 public function test_limits_and_invalid_files_are_rejected_without_creating_reviews():void {
  Storage::fake('private');$before=Storage::disk('private')->allFiles();$b=$this->entity();$this->actingAs(User::factory()->create());$fields=['rating'=>3,'title'=>'Experience','body'=>'Details'];
  $this->post('/api/businesses/'.$b->id.'/reviews',$fields+['evidence'=>$this->images(21)],['Accept'=>'application/json'])->assertUnprocessable();
  $this->post('/api/businesses/'.$b->id.'/reviews',$fields+['evidence'=>[UploadedFile::fake()->create('bad.exe',10,'application/x-msdownload')]],['Accept'=>'application/json'])->assertUnprocessable();
  $this->assertDatabaseCount('reviews',0);$this->assertSame($before,Storage::disk('private')->allFiles());
 }
 public function test_scam_report_accepts_multiple_images_and_reviews_remain_strictly_decoupled():void {
  Storage::fake('private');$b=$this->entity();$this->actingAs(User::factory()->create());
  $this->post('/api/businesses/'.$b->id.'/scam-cases',['title'=>'Concern','summary'=>'Description','evidence'=>$this->images(3)],['Accept'=>'application/json'])->assertCreated();
  $this->assertDatabaseCount('scam_case_evidence',3);
  $this->post('/api/businesses/'.$b->id.'/reviews',['rating'=>2,'title'=>'Concern','body'=>'Description','request_scam_alert'=>1,'evidence'=>$this->images(2)],['Accept'=>'application/json'])->assertCreated();
  // Reviews must not create scam case evidence
  $this->assertDatabaseCount('scam_case_evidence',3);
 }
 public function test_twenty_review_images_are_private_and_combined_legacy_upload_limit_is_enforced():void {
  Storage::fake('private');$b=$this->entity();$this->actingAs(User::factory()->create());$fields=['rating'=>4,'title'=>'Experience','body'=>'Details'];
  $this->post('/api/businesses/'.$b->id.'/reviews',$fields+['evidence'=>$this->images(20)],['Accept'=>'application/json'])->assertCreated();
  $review=Review::firstOrFail();$this->assertCount(20,$review->evidence_paths);
  $this->getJson('/api/reviews')->assertJsonCount(0,'data.0.public_media')->assertJsonMissingPath('data.0.evidence_paths');
  $this->post('/api/businesses/'.$b->id.'/reviews',$fields+['evidence'=>$this->images(20),'file'=>$this->images(1)[0]],['Accept'=>'application/json'])->assertUnprocessable();
  $this->assertDatabaseCount('reviews',1);
 }
 public function test_case_evidence_accepts_twenty_and_followup_cannot_exceed_total_twenty():void {
  Storage::fake('private');$b=$this->entity();$this->actingAs(User::factory()->create());$fields=['title'=>'Private concern','summary'=>'Private description'];
  $this->post('/api/businesses/'.$b->id.'/scam-cases',$fields+['evidence'=>$this->images(20)],['Accept'=>'application/json'])->assertCreated();
  $case=ScamCase::firstOrFail();$this->assertSame(20,$case->evidence()->count());
  $this->post('/api/scam-cases/'.$case->id.'/evidence',['evidence'=>$this->images(1)],['Accept'=>'application/json'])->assertUnprocessable();
  $this->assertSame(20,$case->evidence()->count());
  $this->post('/api/businesses/'.$b->id.'/scam-cases',$fields+['evidence'=>$this->images(21)],['Accept'=>'application/json'])->assertUnprocessable();
  $this->assertDatabaseCount('scam_cases',1);
  $response=$this->post('/api/businesses/'.$b->id.'/scam-cases',$fields,['Accept'=>'application/json'])->assertCreated();
  $empty=ScamCase::findOrFail($response->json('data.id'));
  $this->post('/api/scam-cases/'.$empty->id.'/evidence',['evidence'=>$this->images(20)],['Accept'=>'application/json'])->assertCreated();
  $this->assertSame(20,$empty->evidence()->count());
 }
 public function test_combined_upload_size_accepts_thirty_five_mb_and_rejects_larger_requests_before_scanning():void {
  Storage::fake('private');$b=$this->entity();$this->actingAs(User::factory()->create());$fields=['title'=>'Private concern','summary'=>'Private description'];
  $oversized=array_map(fn($index)=>UploadedFile::fake()->create('large-'.$index.'.pdf',9*1024,'application/pdf'),range(1,4));
  $this->post('/api/businesses/'.$b->id.'/scam-cases',$fields+['evidence'=>$oversized],['Accept'=>'application/json'])
   ->assertUnprocessable()->assertJsonPath('message','Attach no more than 35 MB of files in total per request.');
  $this->assertDatabaseCount('scam_cases',0);
  $this->assertSame(0,DB::table('audit_logs')->where('action','upload.scan_passed')->count());
  $withinLimit=array_map(fn($index)=>UploadedFile::fake()->create('within-'.$index.'.pdf',7*1024,'application/pdf'),range(1,5));
  $this->post('/api/businesses/'.$b->id.'/scam-cases',$fields+['evidence'=>$withinLimit],['Accept'=>'application/json'])->assertCreated();
  $this->assertDatabaseCount('scam_case_evidence',5);
  $this->assertSame(5,DB::table('audit_logs')->where('action','upload.scan_passed')->count());
 }
}
