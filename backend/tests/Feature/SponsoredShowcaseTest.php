<?php
namespace Tests\Feature;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SponsoredShowcaseTest extends TestCase
{
    use RefreshDatabase;

    private function campaign(string $slug, array $business=[], array $campaign=[]): Business
    {
        $item=Business::create($business+['name'=>$slug,'slug'=>$slug,'category'=>'Products','status'=>'approved','verified'=>false]);
        DB::table('sponsored_campaigns')->insert($campaign+['business_id'=>$item->id,'placement'=>'search','category'=>'Products','active'=>true,'starts_at'=>today()->toDateString(),'ends_at'=>today()->addDay()->toDateString(),'created_at'=>now(),'updated_at'=>now()]);
        return $item;
    }

    public function test_guest_showcase_contains_only_eligible_paid_campaigns_without_verification_claims(): void
    {
        $this->campaign('active');
        $this->campaign('paused',[],['active'=>false]);
        $this->campaign('pending',['status'=>'pending']);
        $this->campaign('rejected',['status'=>'rejected']);
        $this->campaign('future',[],['starts_at'=>today()->addDay()->toDateString()]);
        $this->campaign('expired',[],['ends_at'=>today()->subDay()->toDateString()]);
        $this->campaign('wrong-category',[],['category'=>'Healthcare']);
        $response=$this->getJson('/api/sponsored/showcase')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.slug','active');
        $this->assertArrayNotHasKey('verified',$response->json('data.0'));
        $this->assertArrayNotHasKey('user_id',$response->json('data.0'));
        $this->assertStringContainsString('not an endorsement',$response->json('policy'));
        $this->getJson('/api/sponsored/showcase?category=Healthcare')->assertOk()->assertJsonCount(0,'data');
    }

    public function test_showcase_deduplicates_organizations_and_does_not_return_merged_entries(): void
    {
        $organization=$this->campaign('shown');
        DB::table('sponsored_campaigns')->insert(['business_id'=>$organization->id,'placement'=>'profile','category'=>'Products','active'=>true,'starts_at'=>today()->toDateString(),'ends_at'=>today()->addDay()->toDateString()]);
        $this->campaign('merged',['merged_into_id'=>$organization->id]);
        $this->getJson('/api/sponsored/showcase')->assertOk()->assertJsonCount(1,'data');
    }
}
