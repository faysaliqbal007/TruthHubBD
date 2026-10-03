<?php
namespace Tests\Feature;
use App\Models\{Business,User,Review};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
class BusinessClaimLifecycleTest extends TestCase {
 use RefreshDatabase;
 public function test_proof_required_and_admin_can_approve_restrict_restore_without_deleting_listing():void {
  Storage::fake('private');$owner=User::factory()->create();$admin=User::factory()->create(['role'=>'admin']);
  $b=Business::create(['name'=>'Fictional claim entity','slug'=>'claim-entity','category'=>'Products','status'=>'approved']);
  $this->getJson('/api/businesses?q=fictional%20products')->assertOk()->assertJsonPath('total',1);
  $review=Review::create(['business_id'=>$b->id,'user_id'=>$admin->id,'author'=>'Example','rating'=>4,'title'=>'Experience','body'=>'Fictional experience','status'=>'published']);
  $this->actingAs($owner)->postJson('/api/businesses/'.$b->id.'/claims',[])->assertUnprocessable();
  $data=['representative_name'=>'Example Owner','role_title'=>'Owner','contact_phone'=>'01000000000','contact_email'=>'owner@example.test','business_address'=>'Example address','document_type'=>'trade_license','evidence'=>UploadedFile::fake()->create('proof.pdf',10,'application/pdf'),'business_photo'=>UploadedFile::fake()->createWithContent('store.png',base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII='))];
  $id=$this->postJson('/api/businesses/'.$b->id.'/claims',$data)->assertCreated()->assertJsonMissingPath('data.evidence_path')->assertJsonMissingPath('data.business_photo_path')->json('data.id');
  $this->postJson('/api/businesses/'.$b->id.'/claims',$data)->assertConflict();
  $this->patchJson('/api/admin/business-claims/'.$id,['status'=>'approved','decision_note'=>'Checked documents'])->assertForbidden();
  $this->get('/api/admin/claim-evidence/'.$id.'?kind=photo')->assertForbidden();
  $this->actingAs($admin)->patchJson('/api/admin/business-claims/'.$id,['status'=>'approved','decision_note'=>'Checked documents'])->assertOk();
  $this->assertTrue($b->fresh()->verified);
  $this->get('/api/admin/claim-evidence/'.$id.'?kind=photo')->assertOk();
  $this->actingAs($owner)->patchJson('/api/businesses/'.$b->id,['name'=>'Fictional updated entity'])->assertOk();
  $this->putJson('/api/reviews/'.$review->id.'/official-response',['body'=>'Thank you for the feedback'])->assertOk();
  $this->actingAs(User::factory()->create())->postJson('/api/businesses/'.$b->id.'/claims',$data)->assertCreated();
  $this->patchJson('/api/businesses/'.$b->id,['name'=>'Unauthorized edit'])->assertForbidden();
  $this->actingAs($admin);
  $this->patchJson('/api/admin/business-claims/'.$id,['status'=>'restricted','decision_note'=>'Authorization disputed'])->assertOk();
  $this->assertFalse($b->fresh()->verified);$this->assertEquals($owner->id,$b->fresh()->user_id);
  $this->actingAs($owner)->patchJson('/api/businesses/'.$b->id,['name'=>'Should not change'])->assertForbidden();
  $this->putJson('/api/reviews/'.$review->id.'/official-response',['body'=>'Blocked response'])->assertForbidden();
  $this->actingAs($admin)->patchJson('/api/admin/business-claims/'.$id,['status'=>'approved','decision_note'=>'Authority rechecked'])->assertOk();
  $this->assertTrue($b->fresh()->verified);$this->assertDatabaseCount('businesses',1);
  $this->actingAs($owner)->patchJson('/api/businesses/'.$b->id,['name'=>'Restored entity'])->assertOk();
  $this->putJson('/api/reviews/'.$review->id.'/official-response',['body'=>'Restored response'])->assertOk();
  $this->assertDatabaseCount('reviews',1);
 }
 public function test_admin_can_edit_decisions_anytime_and_revoke_or_reapprove(): void {
  $user = User::factory()->create(); $admin = User::factory()->create(['role' => 'admin']);
  $b = Business::create(['name' => 'Editable Claim test', 'slug' => 'editable-claim-test', 'category' => 'Products', 'status' => 'approved']);
  $claim = \App\Models\BusinessClaim::create([
      'business_id' => $b->id,
      'user_id' => $user->id,
      'representative_name' => 'Test',
      'role_title' => 'Owner',
      'contact_phone' => '01000000000',
      'status' => 'submitted',
      'evidence_path' => 'proof/license.pdf',
      'business_photo_path' => 'proof/photo.png'
  ]);
  $this->getJson('/api/admin/business-claims')->assertUnauthorized();
  $this->actingAs($user)->getJson('/api/admin/business-claims')->assertForbidden();
  
  // 1. Admin rejects claim
  $this->actingAs($admin)->patchJson('/api/admin/business-claims/'.$claim->id, ['status' => 'rejected', 'decision_note' => 'Insufficient initial proof'])->assertOk();
  $this->assertEquals('rejected', $claim->fresh()->status);
  $this->assertNull($b->fresh()->user_id);
  
  // 2. Admin can reconsider and approve anytime!
  $this->patchJson('/api/admin/business-claims/'.$claim->id, ['status' => 'approved', 'decision_note' => 'Reconsidered after verified documentation'])->assertOk();
  $this->assertEquals('approved', $claim->fresh()->status);
  $this->assertEquals($user->id, $b->fresh()->user_id);
  $this->assertTrue($b->fresh()->verified);
  $this->assertEquals('business', $user->fresh()->role);

  // 3. Admin can revoke access anytime (reverting to rejected & stripping ownership)
  $this->patchJson('/api/admin/business-claims/'.$claim->id, ['status' => 'rejected', 'decision_note' => 'False information discovered, representation revoked'])->assertOk();
  $this->assertEquals('rejected', $claim->fresh()->status);
  $this->assertNull($b->fresh()->user_id);
  $this->assertFalse($b->fresh()->verified);
  $this->assertEquals('user', $user->fresh()->role);
  $this->assertTrue($user->fresh()->claim_blocked);
 }

 public function test_owner_comments_show_business_identity_while_reviews_and_cases_show_citizen_name(): void {
  Storage::fake('private');
  $citizen = User::factory()->create(['name' => 'Karim Ahmed', 'email' => 'karim@example.test', 'role' => 'user']);
  $admin = User::factory()->create(['role' => 'admin']);
  $customer = User::factory()->create(['name' => 'Rahim Customer']);

  $apex = Business::create(['name' => 'Apex Footwear', 'slug' => 'apex-footwear', 'category' => 'Retail', 'status' => 'approved']);
  $otherBiz = Business::create(['name' => 'Grameenphone', 'slug' => 'grameenphone', 'category' => 'Telecom', 'status' => 'approved']);

  // 1. Citizen claims Apex Footwear
  $claimData = [
      'representative_name' => 'Karim Ahmed',
      'role_title' => 'Managing Director',
      'contact_phone' => '+8801700000000',
      'contact_email' => 'karim@apex.test',
      'business_address' => 'Tejgaon, Dhaka',
      'document_type' => 'trade_license',
      'evidence' => UploadedFile::fake()->create('license.pdf', 10, 'application/pdf'),
      'business_photo' => UploadedFile::fake()->createWithContent('store.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=')),
  ];

  $claimId = $this->actingAs($citizen)->postJson('/api/businesses/' . $apex->id . '/claims', $claimData)
      ->assertCreated()->json('data.id');

  // Cannot submit a 2nd claim for another business while one is pending
  $this->actingAs($citizen)->postJson('/api/businesses/' . $otherBiz->id . '/claims', $claimData)
      ->assertConflict();

  // Admin approves claim -> citizen becomes verified representative of Apex Footwear
  $this->actingAs($admin)->patchJson('/api/admin/business-claims/' . $claimId, ['status' => 'approved', 'decision_note' => 'Approved valid claim'])
      ->assertOk();

  $this->assertEquals($citizen->id, $apex->fresh()->user_id);
  $this->assertEquals('business', $citizen->fresh()->role);

  // Cannot claim another business even after approval (1 business per citizen rule)
  $this->actingAs($citizen)->postJson('/api/businesses/' . $otherBiz->id . '/claims', $claimData)
      ->assertConflict();

  // 2. Customer reviews Apex Footwear
  $apexReview = Review::create([
      'business_id' => $apex->id,
      'user_id' => $customer->id,
      'author' => 'Rahim Customer',
      'rating' => 4,
      'title' => 'Good shoes',
      'body' => 'Bought sports shoes yesterday.',
      'status' => 'published'
  ]);

  // Karim comments on the review of HIS OWN organization (Apex Footwear)
  $commentRes = $this->actingAs($citizen)->postJson('/api/reviews/' . $apexReview->id . '/comments', [
      'body' => 'Thank you from our official team for choosing Apex!'
  ])->assertCreated();

  $this->assertEquals('Apex Footwear', $commentRes->json('data.author'));
  $this->assertTrue($commentRes->json('data.is_organization'));

  // Fetching the review discussion shows Apex Footwear as the author, NOT Karim Ahmed
  $reviewShow = $this->getJson('/api/reviews/' . $apexReview->id)->assertOk();
  $comments = $reviewShow->json('data.comments');
  $this->assertCount(1, $comments);
  $this->assertEquals('Apex Footwear', $comments[0]['author']);
  $this->assertTrue($comments[0]['is_organization']);
  $this->assertEquals('Official Organization', $comments[0]['badge']);

  // 3. Karim CANNOT write a review on his own business
  $this->actingAs($citizen)->postJson('/api/businesses/' . $apex->id . '/reviews', [
      'rating' => 5,
      'title' => 'Fake self review',
      'body' => 'We are the best shoes ever in town.',
  ])->assertForbidden();

  // Karim CANNOT write a scam case on his own business
  $this->actingAs($citizen)->postJson('/api/businesses/' . $apex->id . '/scam-cases', [
      'title' => 'Self scam case',
      'summary' => 'This should be blocked.',
  ])->assertStatus(422);

  // 4. Karim CAN write a review on ANOTHER business (Grameenphone)
  // and it shows his personal citizen user name ("Karim Ahmed"), NOT "Apex Footwear"
  $gpReviewRes = $this->actingAs($citizen)->postJson('/api/businesses/' . $otherBiz->id . '/reviews', [
      'rating' => 3,
      'title' => 'Internet connectivity issue',
      'body' => 'Network was slow in my area.',
  ])->assertCreated();

  $this->assertEquals('Karim Ahmed', $gpReviewRes->json('data.author'));

  // When commenting on Grameenphone's review, it shows his citizen name ("Karim Ahmed"), NOT "Apex Footwear"
  $gpCommentRes = $this->actingAs($citizen)->postJson('/api/reviews/' . $gpReviewRes->json('data.id') . '/comments', [
      'body' => 'Still experiencing this issue.'
  ])->assertCreated();

  $this->assertEquals('Karim Ahmed', $gpCommentRes->json('data.author'));
  $this->assertFalse($gpCommentRes->json('data.is_organization'));
 }

 public function test_disputed_claim_transfers_ownership_and_bans_fraudulent_claimant_from_further_claims(): void
 {
  Storage::fake('private');
  $admin = User::factory()->create(['role' => 'admin']);
  
  // Person 1 (Impostor)
  $impostor = User::factory()->create(['name' => 'Fake Rep', 'email' => 'fake@example.test', 'role' => 'user']);
  // Person 2 (Legitimate Owner)
  $realOwner = User::factory()->create(['name' => 'Real Owner', 'email' => 'real@example.test', 'role' => 'user']);

  $business = Business::create([
      'name' => 'Dhaka Medical Equipment',
      'slug' => 'dhaka-medical-equipment',
      'category' => 'Healthcare',
      'location' => 'Dhaka',
      'status' => 'approved',
      'verified' => false,
  ]);

  // 1. Person 1 claims the business and admin mistakenly approves it
  $fakeProof = UploadedFile::fake()->create('fake-license.pdf', 300, 'application/pdf');
  $fakePhoto = UploadedFile::fake()->createWithContent('fake-store.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII='));

  $claim1Res = $this->actingAs($impostor)->post('/api/businesses/' . $business->id . '/claims', [
      'representative_name' => 'Fake Rep',
      'role_title' => 'Managing Director',
      'contact_phone' => '+8801700000001',
      'contact_email' => 'fake@example.test',
      'business_address' => 'Dhaka, Bangladesh',
      'document_type' => 'trade_license',
      'evidence' => $fakeProof,
      'business_photo' => $fakePhoto,
  ])->assertCreated();

  $claim1Id = $claim1Res->json('data.id');

  // Admin approves Person 1
  $this->actingAs($admin)->patchJson('/api/admin/business-claims/' . $claim1Id, [
      'status' => 'approved',
      'decision_note' => 'Approved by initial mistake.'
  ])->assertOk();

  $this->assertEquals($impostor->id, $business->fresh()->user_id);
  $this->assertEquals('business', $impostor->fresh()->role);

  // 2. Person 2 (Real Owner) submits a dispute claim with valid documents
  $realProof = UploadedFile::fake()->create('real-trade-license.pdf', 500, 'application/pdf');
  $realPhoto = UploadedFile::fake()->createWithContent('real-store.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII='));

  $claim2Res = $this->actingAs($realOwner)->post('/api/businesses/' . $business->id . '/claims', [
      'representative_name' => 'Real Owner',
      'role_title' => 'Original Founder & CEO',
      'contact_phone' => '+8801700000002',
      'contact_email' => 'real@example.test',
      'business_address' => 'Dhaka, Bangladesh',
      'document_type' => 'trade_license',
      'evidence' => $realProof,
      'business_photo' => $realPhoto,
  ])->assertCreated();

  $claim2Id = $claim2Res->json('data.id');

  // Verify in admin queue that claim 2 is marked as dispute
  $queueRes = $this->actingAs($admin)->getJson('/api/admin/business-claims?status=submitted')->assertOk();
  $disputeClaim = collect($queueRes->json('data'))->firstWhere('id', $claim2Id);
  $this->assertTrue($disputeClaim['is_dispute']);
  $this->assertEquals('Fake Rep', $disputeClaim['current_owner_name']);

  // 3. Admin approves Person 2's claim
  $this->actingAs($admin)->patchJson('/api/admin/business-claims/' . $claim2Id, [
      'status' => 'approved',
      'decision_note' => 'Legitimate ownership confirmed via original Trade License.'
  ])->assertOk();

  // Verification 1: Business ownership transferred to Person 2
  $this->assertEquals($realOwner->id, $business->fresh()->user_id);
  $this->assertTrue($business->fresh()->verified);
  $this->assertEquals('business', $realOwner->fresh()->role);

  // Verification 2: Person 1 access removed and role reverted to 'user'
  $impostorFresh = $impostor->fresh();
  $this->assertEquals('user', $impostorFresh->role);
  // Verification 3: Person 1 is banned from creating/claiming any organization account
  $this->assertTrue($impostorFresh->claim_blocked);
  $this->assertNotNull($impostorFresh->claim_blocked_reason);

  // Verification 4: Person 1 CANNOT claim another organization
  $anotherBiz = Business::create([
      'name' => 'Another Shop',
      'slug' => 'another-shop',
      'category' => 'Retail',
      'location' => 'Dhaka',
      'status' => 'approved',
      'verified' => false,
  ]);

  $this->actingAs($impostorFresh)->post('/api/businesses/' . $anotherBiz->id . '/claims', [
      'representative_name' => 'Fake Rep Again',
      'role_title' => 'Manager',
      'contact_phone' => '+8801700000001',
      'contact_email' => 'fake@example.test',
      'business_address' => 'Dhaka',
      'document_type' => 'trade_license',
      'evidence' => $fakeProof,
      'business_photo' => $fakePhoto,
  ])->assertStatus(403);

  // Verification 5: Person 1 can STILL use TruthHub for other purposes (e.g. review a business)
  $reviewRes = $this->actingAs($impostorFresh)->postJson('/api/businesses/' . $anotherBiz->id . '/reviews', [
      'rating' => 4,
      'title' => 'Decent experience',
      'body' => 'I visited this shop as a citizen.',
  ])->assertCreated();

  $this->assertEquals('Fake Rep', $reviewRes->json('data.author'));
 }
}
