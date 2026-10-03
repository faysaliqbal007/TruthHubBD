<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;
class StaffSecurityTest extends TestCase {
 use RefreshDatabase;
 public function test_staff_requires_confirmed_second_factor_and_cannot_replay_code():void{
  config(['trust.staff_mfa_required'=>true]);
  config(['sanctum.stateful'=>['localhost:3000']]);
  $this->withHeaders(['Origin'=>'http://localhost:3000']);
  $u=User::factory()->create(['role'=>'admin','password'=>Hash::make('StrongTestPassword123')]);
  $this->actingAs($u)->getJson('/api/admin/campaigns')->assertForbidden()->assertJsonPath('requires_mfa',true);
  $setup=$this->postJson('/api/security/enroll',['password'=>'StrongTestPassword123'])->assertOk();
  $secret=$setup->json('secret');$otp=(new Google2FA)->getCurrentOtp($secret);
  $this->postJson('/api/security/verify',['code'=>$otp])->assertOk()->assertJsonCount(8,'recovery_codes');
  $this->actingAs($u->fresh())->getJson('/api/admin/campaigns')->assertOk();
  $this->postJson('/api/security/verify',['code'=>$otp])->assertUnprocessable();
  $this->getJson('/api/user')->assertJsonMissingPath('user.two_factor_secret')->assertJsonMissingPath('user.two_factor_recovery_hashes');
 }
}
