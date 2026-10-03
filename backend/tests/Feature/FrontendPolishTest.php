<?php
namespace Tests\Feature;
use App\Models\{Business,Review,ScamCase,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class FrontendPolishTest extends TestCase {
 use RefreshDatabase;
 private function entity(string $slug,string $location):Business{return Business::create(['name'=>$slug,'slug'=>$slug,'category'=>'Products','status'=>'approved','location'=>$location]);}
 public function test_location_counts_and_pages_are_filtered_before_pagination():void{
  for($i=0;$i<4;$i++)$this->entity('dhaka-'.$i,'Dhanmondi, Dhaka');
  $this->entity('sylhet-branch','Sylhet, Bangladesh');$this->entity('gazipur-branch','Gazipur');
  $this->getJson('/api/businesses?location=Sylhet%2C%20Bangladesh&limit=1')->assertOk()->assertJsonPath('total',1)->assertJsonPath('last_page',1)->assertJsonPath('data.0.slug','sylhet-branch');
  $this->getJson('/api/businesses?location=Dhaka%20Division&limit=2')->assertOk()->assertJsonPath('total',5)->assertJsonPath('last_page',3);
  $this->getJson('/api/businesses?location=All%20Bangladesh')->assertJsonPath('total',6);
 }
 public function test_comments_and_replies_persist_and_guest_posts_are_rejected():void{
  $b=$this->entity('shop','Dhaka');$u=User::factory()->create();
  $review=Review::create(['business_id'=>$b->id,'author'=>'Customer','rating'=>4,'title'=>'Experience','body'=>'Delivery experience','status'=>'published']);
  $this->postJson('/api/reviews/'.$review->id.'/comments',['body'=>'Question'])->assertUnauthorized();
  $this->actingAs($u);$comment=$this->postJson('/api/reviews/'.$review->id.'/comments',['body'=>'Question'])->assertCreated()->json('data.id');
  $this->postJson('/api/reviews/'.$review->id.'/comments',['body'=>'Follow up','parent_id'=>$comment])->assertCreated();
  $this->getJson('/api/reviews/'.$review->id)->assertOk()->assertJsonCount(2,'data.comments')->assertJsonPath('data.comments.1.parent_id',$comment)->assertJsonPath('data.comments.1.author',$u->name);
 }
 public function test_directory_rating_filters_match_published_review_averages():void{
  $b=$this->entity('reviewed-shop','Dhaka');
  Review::create(['business_id'=>$b->id,'author'=>'Customer','rating'=>4,'title'=>'Experience','body'=>'Delivery experience','status'=>'published']);
  Review::create(['business_id'=>$b->id,'author'=>'Customer','rating'=>1,'title'=>'Pending','body'=>'Not yet public','status'=>'under_review']);
  $this->getJson('/api/businesses?min_rating=4')->assertOk()->assertJsonPath('total',1)->assertJsonPath('data.0.rating',4)->assertJsonPath('data.0.reviewCount',1)->assertJsonCount(0,'data.0.reviews');
  $this->getJson('/api/businesses?min_rating=4.5')->assertOk()->assertJsonPath('total',0);
 }
 public function test_alert_filters_use_public_business_location_without_private_amounts():void{
  $u=User::factory()->create();foreach(['Dhaka','Sylhet'] as $city){$b=$this->entity(strtolower($city),$city);ScamCase::create(['case_code'=>$city,'business_id'=>$b->id,'reporter_user_id'=>$u->id,'title'=>'Private','summary'=>'Private details','amount'=>12500,'public_summary'=>'Approved summary','status'=>'published','published_at'=>now()]);}
  $this->getJson('/api/scam-cases?location=Sylhet')->assertOk()->assertJsonPath('data.total',1)->assertJsonPath('data.data.0.business.location','Sylhet')->assertJsonMissingPath('data.data.0.amount');
 }
}
