<?php
namespace Tests\Feature;
use App\Models\{Business,ScamCase,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class MapsAndCaseDiscoveryTest extends TestCase {
 use RefreshDatabase;
 public function test_physical_location_is_required_but_online_business_can_skip_it():void{
  $this->actingAs(User::factory()->create());
  $this->postJson('/api/businesses',['name'=>'Physical shop','category'=>'Products','presence'=>'physical'])->assertUnprocessable();
  $this->postJson('/api/businesses',['name'=>'Online shop','category'=>'Products','presence'=>'online','facebook_url'=>'https://facebook.com/example'])->assertCreated()->assertJsonPath('data.presence','online')->assertJsonPath('data.userId',null);
 }
 public function test_maps_reference_is_preserved_and_existing_place_cannot_be_recreated():void{
  $this->actingAs(User::factory()->create());$data=['name'=>'Test branch','category'=>'Products','presence'=>'both','location'=>'Dhaka','google_place_id'=>'test-place-reference'];
  $this->postJson('/api/businesses',$data)->assertCreated()->assertJsonPath('data.googlePlaceId','test-place-reference');
  $this->postJson('/api/businesses',$data)->assertConflict()->assertJsonPath('existing_slug','test-branch');
 }
 public function test_public_case_search_is_paginated_and_never_searches_private_title():void{
  $user=User::factory()->create();$b=Business::create(['name'=>'Test entity','slug'=>'test-entity','category'=>'Products','status'=>'approved']);
  for($i=0;$i<22;$i++)ScamCase::create(['case_code'=>'CASE-'.$i,'business_id'=>$b->id,'reporter_user_id'=>$user->id,'title'=>'private-secret-marker','summary'=>'Private','public_summary'=>'Reviewed summary','status'=>'published','published_at'=>now()]);
  $this->getJson('/api/scam-cases?page=2')->assertOk()->assertJsonPath('data.total',22)->assertJsonCount(2,'data.data');
  $this->getJson('/api/scam-cases?q=private-secret-marker')->assertJsonPath('data.total',0);
  $this->getJson('/api/scam-cases?q=CASE-21')->assertJsonPath('data.total',1);
  ScamCase::where('case_code','CASE-21')->update(['published_at'=>now()->subDays(40)]);
  $this->getJson('/api/scam-cases?period=7')->assertJsonPath('data.total',21);
  $this->getJson('/api/scam-cases?sort=oldest')->assertJsonPath('data.data.0.case_code','CASE-21');
  $this->getJson('/api/scam-cases?period=invalid')->assertUnprocessable();
 }
}
