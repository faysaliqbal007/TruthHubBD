<?php
namespace Tests\Feature;
use App\Models\{Business,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SponsoredDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_matches_related_category_and_only_active_approved_sponsors(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        Business::create(['name'=>'Laptop store','slug'=>'laptop-store','category'=>'Products','status'=>'approved']);
        $sponsor=Business::create(['name'=>'Fictional electronics','slug'=>'fictional-electronics','category'=>'Products','status'=>'approved']);
        $payload=['business_id'=>$sponsor->id,'placement'=>'search','category'=>'Products','starts_at'=>today()->toDateString(),'ends_at'=>today()->addDay()->toDateString(),'active'=>true];
        $id=$this->postJson('/api/admin/campaigns',$payload)->assertCreated()->json('data.id');
        $this->getJson('/api/sponsored?placement=search&q=Laptop')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.slug','fictional-electronics');
        $this->getJson('/api/sponsored?placement=search&q=unrelated')->assertJsonCount(0,'data');
        $this->getJson('/api/sponsored?placement=search&category=All%20Categories')->assertJsonCount(0,'data');
        $this->getJson('/api/sponsored?placement=profile&category=Products')->assertJsonCount(0,'data');
        $this->patchJson('/api/admin/campaigns/'.$id,['active'=>false])->assertOk();
        $this->getJson('/api/sponsored?placement=search&q=Laptop')->assertJsonCount(0,'data');
        $this->patchJson('/api/admin/campaigns/'.$id,['active'=>true])->assertOk();
        $sponsor->update(['status'=>'rejected']);
        $this->getJson('/api/sponsored?placement=search&q=Laptop')->assertJsonCount(0,'data');
    }

    public function test_expired_and_future_campaigns_are_not_served(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $b=Business::create(['name'=>'Fictional sponsor','slug'=>'fictional-sponsor','category'=>'Products','status'=>'approved']);
        foreach ([-3,3] as $offset) {
            $this->postJson('/api/admin/campaigns',['business_id'=>$b->id,'placement'=>'search','category'=>'Products','starts_at'=>today()->addDays($offset)->toDateString(),'ends_at'=>today()->addDays($offset+1)->toDateString(),'active'=>true])->assertCreated();
        }
        $this->getJson('/api/sponsored?placement=search&category=Products')->assertJsonCount(0,'data');
    }
}
