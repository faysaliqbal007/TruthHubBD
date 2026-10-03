<?php

namespace Tests\Feature;

use App\Models\{Business, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdministrativeLocationTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['email_verified_at'=>now()]);
    }

    private function physical(array $overrides=[]): array
    {
        return array_replace(['name'=>'Fictional organization','category'=>'Products','presence'=>'physical','division_id'=>'dhaka','district_id'=>'dhaka-district','upazila_id'=>'savar'],$overrides);
    }

    public function test_creation_composes_canonical_location_preserves_street_and_does_not_assign_ownership(): void
    {
        $user=$this->user();$this->actingAs($user,'sanctum');
        $first=$this->postJson('/api/businesses',$this->physical())->assertCreated()->assertJsonPath('data.location','Savar, Dhaka, Dhaka')->assertJsonPath('data.userId',null)->assertJsonPath('data.verified',false);
        $this->assertDatabaseHas('businesses',['id'=>$first->json('data.id'),'created_by_user_id'=>$user->id,'status'=>'pending','user_id'=>null]);
        $this->postJson('/api/businesses',$this->physical(['name'=>'Street address example','location'=>'House 2, Main Road, Savar, Dhaka, Dhaka']))->assertCreated()->assertJsonPath('data.location','House 2, Main Road, Savar, Dhaka, Dhaka');
        $this->postJson('/api/businesses',$this->physical(['name'=>'District-only example','upazila_id'=>null]))->assertCreated()->assertJsonPath('data.location','Dhaka, Dhaka');
        $this->postJson('/api/businesses',$this->physical(['name'=>'Legacy urban area example','upazila_id'=>'dhanmondi']))->assertCreated()->assertJsonPath('data.location','Dhanmondi, Dhaka, Dhaka');
    }

    public function test_bangla_and_accepted_alias_suffixes_normalize_to_dataset_names(): void
    {
        $this->actingAs($this->user(),'sanctum');
        $this->postJson('/api/businesses',$this->physical(['location'=>'বাসা ২, সাভার, ঢাকা, ঢাকা']))->assertCreated()->assertJsonPath('data.location','বাসা ২, Savar, Dhaka, Dhaka');
        $this->postJson('/api/businesses',$this->physical(['name'=>'Alias example','division_id'=>'chittagong','district_id'=>'chittagong-district','upazila_id'=>'anwara','location'=>'Anwara, Chattogram, Chattogram']))->assertCreated()->assertJsonPath('data.location','Anwara, Chittagong, Chittagong');
    }

    public function test_unknown_partial_and_mismatched_hierarchy_or_address_are_rejected_before_creation(): void
    {
        $this->actingAs($this->user(),'sanctum');
        $bad=[['division_id'=>'unknown'],['division_id'=>null],['district_id'=>null],['district_id'=>'gazipur'],['upazila_id'=>'gazipur-sadar'],['upazila_id'=>'unknown'],['division_id'=>'online-only'],['district_id'=>123],['location'=>'Savar, Gazipur, Dhaka'],['location'=>'Chattogram'],['presence'=>'online']];
        foreach($bad as $overrides)$this->postJson('/api/businesses',$this->physical($overrides))->assertUnprocessable();
        $this->assertDatabaseCount('businesses',0);
    }

    public function test_legacy_clients_remain_compatible_and_online_only_is_not_a_location_id(): void
    {
        $this->actingAs($this->user(),'sanctum');
        $this->postJson('/api/businesses',['name'=>'Legacy physical example','category'=>'Products','presence'=>'physical','location'=>'Old street text, Dhaka'])->assertCreated()->assertJsonPath('data.location','Old street text, Dhaka');
        $this->postJson('/api/businesses',['name'=>'Online example','category'=>'Products','presence'=>'online'])->assertCreated()->assertJsonPath('data.presence','online');
        $this->postJson('/api/businesses',['name'=>'Invalid online selection','category'=>'Products','presence'=>'online','division_id'=>'OnlineOnly','district_id'=>'OnlineOnly'])->assertUnprocessable();
    }

    public function test_edit_uses_the_same_hierarchy_and_address_validation_and_keeps_ownership_gate(): void
    {
        $owner=$this->user();$this->actingAs($owner,'sanctum');
        $business=Business::create(['name'=>'Represented test organization','slug'=>'represented-test','category'=>'Products','status'=>'approved','presence'=>'physical','location'=>'Old address','user_id'=>$owner->id,'verified'=>true,'google_place_id'=>'old-place','latitude'=>23,'longitude'=>90]);
        $url='/api/businesses/'.$business->id;
        $this->patchJson($url,['division_id'=>'dhaka','district_id'=>'dhaka-district','upazila_id'=>'gazipur-sadar','location'=>'Wrong district'])->assertUnprocessable();
        $this->patchJson($url,['division_id'=>'dhaka','district_id'=>'dhaka-district','upazila_id'=>'savar','location'=>'Savar, Gazipur, Dhaka'])->assertUnprocessable();
        $this->patchJson($url,['division_id'=>'dhaka','district_id'=>null])->assertUnprocessable();
        $this->assertSame('Old address',$business->fresh()->location);
        $this->patchJson($url,['division_id'=>'dhaka','district_id'=>'dhaka-district','upazila_id'=>'savar','location'=>'House 7, Savar, Dhaka, Dhaka'])->assertOk()->assertJsonPath('data.location','House 7, Savar, Dhaka, Dhaka')->assertJsonPath('data.googlePlaceId',null);
        $this->assertDatabaseHas('businesses',['id'=>$business->id,'latitude'=>null,'longitude'=>null,'user_id'=>$owner->id,'verified'=>true]);
        $this->patchJson($url,['location'=>'Legacy revised text'])->assertOk()->assertJsonPath('data.location','Legacy revised text');
        $business->update(['presence'=>'online']);
        $this->patchJson($url,['division_id'=>'dhaka','district_id'=>'dhaka-district'])->assertUnprocessable();
        $this->actingAs($this->user(),'sanctum')->patchJson($url,['division_id'=>'dhaka','district_id'=>'dhaka-district'])->assertForbidden();
        $business->update(['verified'=>false]);
        $this->actingAs($owner,'sanctum')->patchJson($url,['division_id'=>'dhaka','district_id'=>'dhaka-district'])->assertForbidden();
    }
}
