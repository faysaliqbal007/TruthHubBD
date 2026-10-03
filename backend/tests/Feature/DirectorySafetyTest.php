<?php
namespace Tests\Feature;
use App\Models\{Business,User,ScamCase};
use App\Services\MalwareScanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{DB,Process,Storage};
use Tests\TestCase;
class DirectorySafetyTest extends TestCase {
 use RefreshDatabase;
 private function entity():Business {return Business::create(['name'=>'Fictional Shop','slug'=>'fictional-shop','category'=>'Products','location'=>'Dhaka','status'=>'approved','source_ref'=>'node/123','rating'=>0]);}
 public function test_search_combines_fields_and_paginates_unrated_imports():void {
  $b=$this->entity();
  $this->getJson('/api/businesses?q=shop%20dhaka')->assertOk()->assertJsonPath('total',1)->assertJsonPath('imported_count',1)->assertJsonPath('data.0.id',$b->id);
  $this->getJson('/api/businesses?q=shop%20dhaka&min_rating=4')->assertJsonPath('total',0);
  $this->getJson('/api/businesses?limit=1&page=2')->assertJsonCount(0,'data')->assertJsonPath('total',1);
 }
 public function test_corrections_require_admin_and_matching_open_report():void {
  $b=$this->entity();$user=User::factory()->create();
  $this->actingAs($user)->postJson('/api/reports',['reportable_type'=>'business','reportable_id'=>$b->id,'reason'=>'Business closed','details'=>'Please check this location'])->assertCreated();
  $report=DB::table('content_reports')->first();
  $payload=['operating_status'=>'closed','report_id'=>$report->id,'reason'=>'Checked authoritative source'];
  $this->patchJson('/api/admin/businesses/'.$b->id.'/facts',$payload)->assertForbidden();
  $this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/admin/businesses/'.$b->id.'/facts',$payload)->assertOk();
  $this->assertDatabaseHas('businesses',['id'=>$b->id,'operating_status'=>'closed','source_ref'=>'node/123']);
  $this->assertDatabaseHas('audit_logs',['action'=>'directory.corrected']);
  $this->patchJson('/api/admin/businesses/'.$b->id.'/facts',$payload)->assertUnprocessable();
 }
 public function test_scanner_clean_infected_and_unavailable_outcomes():void {
  foreach([0=>200,1=>422,2=>503] as $exit=>$status){
   Process::fake(['*'=>Process::result(exitCode:$exit)]);
   try {(new MalwareScanner)->scan('fictional.pdf');$this->assertSame(200,$status);}
   catch(\Symfony\Component\HttpKernel\Exception\HttpException $e){$this->assertSame($status,$e->getStatusCode());}
  }
 }
 public function test_unavailable_scanner_never_stores_upload_or_creates_case():void {
  Storage::fake('private');Process::fake(['*'=>Process::result(exitCode:2)]);$this->app->instance(MalwareScanner::class,new MalwareScanner);
  // Windows may retain a locked fixture from a previous download test. Assert no new file is stored.
  $before=Storage::disk('private')->allFiles();
  $b=$this->entity();$this->actingAs(User::factory()->create())->postJson('/api/businesses/'.$b->id.'/scam-cases',['title'=>'Test','summary'=>'Private test','evidence'=>[UploadedFile::fake()->create('proof.pdf',10,'application/pdf')]])->assertStatus(503);
  $this->assertDatabaseCount('scam_cases',0);$this->assertSame($before,Storage::disk('private')->allFiles());
 }
 public function test_all_uploads_are_checked_in_one_scanner_process():void {
  Storage::fake('private');Process::fake(['*'=>Process::result(exitCode:0)]);$this->app->instance(MalwareScanner::class,new MalwareScanner);
  $files=[UploadedFile::fake()->create('first.pdf',10,'application/pdf'),UploadedFile::fake()->create('second.pdf',10,'application/pdf')];
  $paths=array_map(fn($file)=>$file->getRealPath(),$files);
  $b=$this->entity();$this->actingAs(User::factory()->create())->postJson('/api/businesses/'.$b->id.'/scam-cases',['title'=>'Batch test','summary'=>'Private test','evidence'=>$files])->assertCreated();
  Process::assertRanTimes(fn()=>true,1);
  Process::assertRan(fn($process)=>is_array($process->command)&&count(array_intersect($paths,$process->command))===2);
  $this->assertDatabaseCount('scam_case_evidence',2);
  $this->assertSame(2,DB::table('audit_logs')->where('action','upload.scan_passed')->count());
 }
 public function test_infected_batch_stores_no_attachments_or_success_audits():void {
  Storage::fake('private');$before=Storage::disk('private')->allFiles();Process::fake(['*'=>Process::result(exitCode:1)]);$this->app->instance(MalwareScanner::class,new MalwareScanner);
  $files=[UploadedFile::fake()->create('first.pdf',10,'application/pdf'),UploadedFile::fake()->create('second.pdf',10,'application/pdf')];
  $b=$this->entity();$this->actingAs(User::factory()->create())->postJson('/api/businesses/'.$b->id.'/scam-cases',['title'=>'Batch test','summary'=>'Private test','evidence'=>$files])->assertUnprocessable()->assertJsonPath('message','This file did not pass the malware safety check.');
  Process::assertRanTimes(fn()=>true,1);
  $this->assertDatabaseCount('scam_cases',0);
  $this->assertDatabaseCount('scam_case_evidence',0);
  $this->assertSame(0,DB::table('audit_logs')->where('action','upload.scan_passed')->count());
  $this->assertSame($before,Storage::disk('private')->allFiles());
 }
 public function test_incident_validation_and_private_reporter_updates():void {
  $b=$this->entity();$user=User::factory()->create();$admin=User::factory()->create(['role'=>'admin']);
  $payload=['title'=>'Private test','summary'=>'Private summary','incident_type'=>'non_delivery','incident_date'=>now()->addDay()->toDateString()];
  $this->actingAs($user)->postJson('/api/businesses/'.$b->id.'/scam-cases',$payload)->assertUnprocessable();
  $payload['incident_date']=now()->subDay()->toDateString();
  $id=$this->postJson('/api/businesses/'.$b->id.'/scam-cases',$payload)->assertCreated()->json('data.id');
  $this->actingAs($admin)->patchJson('/api/moderation/scam-cases/'.$id,['status'=>'needs_evidence','reporter_update'=>'Please upload your receipt'])->assertOk();
  $this->actingAs($user)->getJson('/api/activity')->assertSee('Please upload your receipt');
  $this->actingAs(User::factory()->create())->getJson('/api/activity')->assertDontSee('Please upload your receipt');
  $this->actingAs($admin)->patchJson('/api/moderation/scam-cases/'.$id,['status'=>'resolved','resolution_note'=>'Receipt checked; matter settled'])->assertOk();
  $this->assertNotNull(ScamCase::find($id)->resolved_at);
  $this->getJson('/api/scam-cases')->assertDontSee('Receipt checked; matter settled');
 }
}
