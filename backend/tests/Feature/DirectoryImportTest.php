<?php
namespace Tests\Feature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use App\Models\Business;
use Tests\TestCase;
class DirectoryImportTest extends TestCase {
 use RefreshDatabase;
 public function test_import_is_attributed_unclaimed_and_idempotent():void {
  Http::fake(['overpass-api.de/*'=>Http::response(['elements'=>[['type'=>'node','id'=>123,'lat'=>23.7,'lon'=>90.4,'tags'=>['name'=>'Fictional import fixture','shop'=>'electronics','website'=>'javascript:alert(1)']]]])]);
  $this->artisan('directory:import-osm',['--limit'=>1])->assertSuccessful();$this->assertDatabaseCount('businesses',0);
  $this->artisan('directory:import-osm',['--limit'=>1,'--apply'=>true])->assertSuccessful();
  $this->artisan('directory:import-osm',['--limit'=>1,'--apply'=>true])->assertSuccessful();
  $this->assertDatabaseCount('businesses',1);$b=Business::firstOrFail();$this->assertNull($b->user_id);$this->assertFalse($b->verified);$this->assertNull($b->website);$this->assertEquals(0,$b->review_count);
  $this->getJson('/api/businesses?q=Fictional')->assertJsonPath('data.0.sourceUrl','https://www.openstreetmap.org/node/123');
  $this->get('/api/directory-data')->assertOk()->assertDownload('truthhubbd-osm-directory.json');
 }
 public function test_name_and_address_duplicate_is_rejected():void {
  $this->actingAs(\App\Models\User::factory()->create());$data=['name'=>'Unique fixture','location'=>'Example road','category'=>'Products'];
  $this->postJson('/api/businesses',$data)->assertCreated();$this->postJson('/api/businesses',$data)->assertConflict();
 }
 public function test_retail_import_rejects_out_of_country_coordinates():void {
  Http::fake(['overpass-api.de/*'=>Http::response(['elements'=>[['type'=>'node','id'=>999,'lat'=>0,'lon'=>0,'tags'=>['name'=>'Invalid location','shop'=>'mall']]]])]);
  $this->artisan('directory:import-osm',['--sector'=>'retail-services','--apply'=>true])->assertSuccessful();
  $this->assertDatabaseCount('businesses',0);
 }
}
