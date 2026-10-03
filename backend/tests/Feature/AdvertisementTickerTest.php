<?php
namespace Tests\Feature;
use App\Models\Advertisement;
use App\Models\AdvertisementTickerSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdvertisementTickerTest extends TestCase {
 use RefreshDatabase;
 private function ad(array $extra=[]):Advertisement{return Advertisement::create($extra+['title_en'=>'Education advertisement','title_bn'=>'শিক্ষার বিজ্ঞাপন','body_en'=>'Read the programme details.','body_bn'=>'কার্যক্রমের বিস্তারিত পড়ুন।','sector'=>'education','status'=>'published','decision_rationale'=>'Private advertisement review reason.']);}
 private function settings(array $extra=[]):array{return $extra+['enabled'=>true,'policy_en'=>'Clearly labelled advertising.','policy_bn'=>'স্পষ্টভাবে চিহ্নিত বিজ্ঞাপন।','decision_rationale'=>'Staff reviewed the homepage message.'];}
 public function test_homepage_placement_and_messages_are_persisted_and_hidden_scheduled_ads_never_leak():void{
  $first=$this->ad();$this->ad(['show_in_ticker'=>false,'title_en'=>'Page-only ad']);$this->ad(['status'=>'paused','title_en'=>'Hidden ad']);$this->ad(['starts_at'=>now()->addDay(),'title_en'=>'Future ad']);
  $this->getJson('/api/advertisement-ticker')->assertOk()->assertJsonCount(1,'data.items')->assertJsonPath('data.items.0.id',$first->id)->assertDontSee('Private advertisement review reason.')->assertDontSee('Page-only ad')->assertDontSee('Hidden ad')->assertDontSee('Future ad');
  $this->getJson('/api/advertisements')->assertJsonCount(2,'data');
  $this->actingAs(User::factory()->create(['role'=>'admin']));
  $this->patchJson('/api/admin/advertisements/'.$first->id,['show_in_ticker'=>true,'ticker_text_en'=>'Enrollment information','ticker_text_bn'=>'ভর্তির তথ্য','decision_rationale'=>'Updated the bilingual homepage advertisement.'])->assertOk();
  $this->getJson('/api/advertisement-ticker')->assertJsonPath('data.items.0.ticker_text_en','Enrollment information')->assertJsonPath('data.items.0.ticker_text_bn','ভর্তির তথ্য');
  $this->patchJson('/api/admin/advertisements/'.$first->id,['show_in_ticker'=>false,'decision_rationale'=>'Removed this advertisement from the homepage.'])->assertOk();
  $this->getJson('/api/advertisement-ticker')->assertJsonCount(0,'data.items');
  $this->assertDatabaseHas('advertisements',['id'=>$first->id,'show_in_ticker'=>false]);
 }
 public function test_global_ticker_settings_are_admin_only_audited_and_control_public_delivery():void{
  $this->ad();$this->getJson('/api/admin/advertisement-ticker')->assertUnauthorized();$this->patchJson('/api/admin/advertisement-ticker',$this->settings())->assertUnauthorized();
  foreach(['user','moderator'] as $role){$this->actingAs(User::factory()->create(['role'=>$role]))->patchJson('/api/admin/advertisement-ticker',$this->settings())->assertForbidden();}
  $this->actingAs(User::factory()->create(['role'=>'admin','email_verified_at'=>null]))->patchJson('/api/admin/advertisement-ticker',$this->settings())->assertForbidden();
  config(['trust.staff_mfa_required'=>true]);$this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/admin/advertisement-ticker',$this->settings())->assertForbidden();config(['trust.staff_mfa_required'=>false]);
  $this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/admin/advertisement-ticker',$this->settings(['enabled'=>false]))->assertOk()->assertJsonPath('data.enabled',false);
  $this->getJson('/api/advertisement-ticker')->assertJsonPath('data.enabled',false)->assertJsonCount(0,'data.items')->assertJsonPath('data.policy_bn','স্পষ্টভাবে চিহ্নিত বিজ্ঞাপন।')->assertDontSee('Staff reviewed');
  $this->assertSame(1,DB::table('audit_logs')->where('auditable_type',AdvertisementTickerSetting::class)->count());
  $this->patchJson('/api/admin/advertisement-ticker',$this->settings())->assertOk();$this->getJson('/api/advertisement-ticker')->assertJsonCount(1,'data.items');
  $this->getJson('/api/admin/advertisement-ticker')->assertJsonPath('data.policy_en','Clearly labelled advertising.');
 }
 public function test_invalid_ticker_values_and_fake_publication_dates_are_rejected():void{
  $ad=$this->ad();$this->actingAs(User::factory()->create(['role'=>'admin']));
  foreach([['policy_en'=>' '],['policy_bn'=>str_repeat('অ',1001)],['decision_rationale'=>'short'],['enabled'=>'not a boolean']] as $bad)$this->patchJson('/api/admin/advertisement-ticker',$this->settings($bad))->assertUnprocessable();
  foreach([['ticker_text_en'=>str_repeat('a',501)],['show_in_ticker'=>'maybe'],['published_at'=>'2001-01-01']] as $bad)$this->patchJson('/api/admin/advertisements/'.$ad->id,$bad+['decision_rationale'=>'Check invalid advertisement control.'])->assertUnprocessable();
  $this->assertDatabaseCount('audit_logs',0);
 }
 public function test_publication_date_is_real_first_publish_time_and_survives_pause_and_restore():void{
  $this->travelTo(\Carbon\Carbon::parse('2026-10-02T08:00:00Z'));$ad=$this->ad(['status'=>'draft']);$this->assertNull($ad->published_at);
  $this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>'published','decision_rationale'=>'Approved this advertisement for publication.'])->assertOk();
  $this->getJson('/api/advertisements')->assertJsonPath('data.0.published_at','2026-10-02T08:00:00.000000Z');
  $this->travel(2)->days();foreach(['paused','published'] as $status)$this->patchJson('/api/admin/advertisements/'.$ad->id,['status'=>$status,'decision_rationale'=>'Reviewed this advertisement display status.'])->assertOk();
  $this->getJson('/api/advertisements')->assertJsonPath('data.0.published_at','2026-10-02T08:00:00.000000Z');
 }
 public function test_ticker_audit_failure_rolls_back_changes():void{
  $before=AdvertisementTickerSetting::findOrFail(1)->getAttributes();$this->actingAs(User::factory()->create(['role'=>'admin']));
  DB::listen(function($query){if(str_contains(strtolower($query->sql),'insert')&&str_contains($query->sql,'audit_logs'))throw new \RuntimeException('Audit failure.');});
  $this->patchJson('/api/admin/advertisement-ticker',$this->settings(['enabled'=>false]))->assertStatus(500);$this->assertSame($before,AdvertisementTickerSetting::findOrFail(1)->getAttributes());
 }
}
