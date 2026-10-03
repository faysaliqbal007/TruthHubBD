<?php

namespace Tests\Feature;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Artisan, Http, Storage};
use Tests\TestCase;

class OsmCommandScopeTest extends TestCase
{
    use RefreshDatabase;

    private function organization(string $slug, ?string $reference, array $overrides=[]): Business
    {
        return Business::create(array_replace(['name'=>'Fictional source scope organization','slug'=>$slug,'category'=>'Products','status'=>'approved','source_ref'=>$reference,'location'=>'Dhaka, Bangladesh','latitude'=>23.7,'longitude'=>90.4,'source_fetched_at'=>now(),'source_url'=>$reference?'https://example.test/source':null],$overrides));
    }

    public function test_offline_osm_quality_ignores_dghs_and_community_records(): void
    {
        $this->organization('osm','osm:node:123',['source_url'=>'https://www.openstreetmap.org/node/123']);
        $dghs=$this->organization('dghs','dghs:facility:123',['latitude'=>null,'longitude'=>null,'source_url'=>'https://facilityregistry.dghs.gov.bd/']);
        $community=$this->organization('community',null,['latitude'=>null,'longitude'=>null]);
        $this->assertSame(0,Artisan::call('directory:quality'));
        $output=json_decode(Artisan::output(),true,512,JSON_THROW_ON_ERROR);
        $this->assertSame('OpenStreetMap',$output['source']);
        $this->assertSame(1,$output['metrics']['imported_count']);
        $this->assertSame(0,$output['metrics']['invalid_source_ref_count']);
        $this->assertSame(0,$output['metrics']['missing_coordinates_count']);
        $this->assertDatabaseHas('businesses',['id'=>$dghs->id,'source_ref'=>'dghs:facility:123','latitude'=>null]);
        $this->assertDatabaseHas('businesses',['id'=>$community->id,'source_ref'=>null,'latitude'=>null]);
    }

    public function test_osm_audit_samples_and_duplicate_candidates_exclude_other_providers(): void
    {
        Storage::fake('private');Http::preventStrayRequests();
        $first=$this->organization('osm-first','osm:node:123',['source_url'=>'https://www.openstreetmap.org/node/123']);
        $second=$this->organization('osm-second','osm:node:456',['source_url'=>'https://www.openstreetmap.org/node/456']);
        $dghs=$this->organization('dghs','dghs:facility:999',['category'=>'Hospitals & Clinics']);
        $community=$this->organization('community',null);
        Http::fake(['https://overpass-api.de/api/interpreter'=>Http::response(['elements'=>[
            ['type'=>'node','id'=>123,'tags'=>['name'=>$first->name,'amenity'=>'clinic']],
            ['type'=>'node','id'=>456,'tags'=>['name'=>$second->name,'shop'=>'clothes']],
        ]])]);
        $this->assertSame(0,Artisan::call('directory:audit',['--apply'=>true]));
        Http::assertSent(fn($request)=>str_contains($request['data'],'node(123);') && str_contains($request['data'],'node(456);') && !str_contains($request['data'],'facility('));
        $report=json_decode(Storage::disk('private')->get('directory-audit.json'),true,512,JSON_THROW_ON_ERROR);
        $this->assertCount(2,$report['records']);
        $this->assertCount(1,$report['duplicate_candidates']);
        $this->assertSame($first->id,$report['duplicate_candidates'][0]['first_id']);
        $this->assertSame($second->id,$report['duplicate_candidates'][0]['second_id']);
        $this->assertSame(1,$report['category_corrections']);
        $this->assertSame('Hospitals & Clinics',$first->fresh()->category);
        $this->assertSame('Hospitals & Clinics',$dghs->fresh()->category);
        $this->assertSame('Products',$community->fresh()->category);
        $this->assertDatabaseCount('businesses',4);
    }

    public function test_osm_audit_does_not_request_a_source_when_only_other_provider_records_exist(): void
    {
        Http::preventStrayRequests();
        $this->organization('dghs','dghs:facility:123');$this->organization('community',null);
        $this->assertSame(0,Artisan::call('directory:audit',['--apply'=>true]));
        Http::assertNothingSent();
        $this->assertDatabaseCount('businesses',2);
    }

    public function test_odbl_export_contains_only_osm_records(): void
    {
        $this->organization('osm','osm:node:123',['source_url'=>'https://www.openstreetmap.org/node/123']);
        $this->organization('dghs','dghs:facility:123');$this->organization('community',null);
        $response=$this->get('/api/directory-data')->assertOk();
        $export=json_decode($response->streamedContent(),true,512,JSON_THROW_ON_ERROR);
        $this->assertSame('ODbL-1.0',$export['license']);
        $this->assertCount(1,$export['data']);
        $this->assertSame('osm:node:123',$export['data'][0]['source_ref']);
    }
}
