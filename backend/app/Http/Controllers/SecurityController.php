<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;
class SecurityController extends Controller {
 public function status(Request $r){return response()->json(['enabled'=>(bool)$r->user()->two_factor_confirmed_at,'verified'=>(int)$r->session()->get('staff_mfa_user')===$r->user()->id && (int)$r->session()->get('staff_mfa_until')>time()]);}
 public function enroll(Request $r){
  $data=$r->validate(['password'=>'required|string']);abort_unless($r->user()->password && Hash::check($data['password'],$r->user()->password),422,'Password confirmation failed.');abort_if($r->user()->two_factor_confirmed_at,409,'Authenticator is already enabled.');
  $secret=(new Google2FA)->generateSecretKey();$r->user()->forceFill(['two_factor_secret'=>$secret])->save();
  return response()->json(['secret'=>$secret]);
 }
 public function verify(Request $r){
  abort_unless($r->hasSession(),403,'A first-party browser session is required.');
  $data=$r->validate(['code'=>'required|string|max:64']);$recovery=[];
  DB::transaction(function()use($r,$data,&$recovery){
   $u=\App\Models\User::whereKey($r->user()->id)->lockForUpdate()->firstOrFail();abort_unless($u->two_factor_secret,422,'Set up your authenticator first.');
   $step=preg_match('/^\d{6}$/',$data['code']) ? (new Google2FA)->verifyKeyNewer($u->two_factor_secret,$data['code'],$u->two_factor_last_step ?? 0,1) : false;
   if($step===false){$hashes=$u->two_factor_recovery_hashes??[];$index=array_search(hash('sha256',$data['code']),$hashes,true);abort_unless($u->two_factor_confirmed_at && $index!==false,422,'Invalid or already used code.');unset($hashes[$index]);$u->two_factor_recovery_hashes=array_values($hashes);}else{$u->two_factor_last_step=$step;}
   if(!$u->two_factor_confirmed_at){$recovery=array_map(fn()=>Str::random(24),range(1,8));$u->two_factor_recovery_hashes=array_map(fn($v)=>hash('sha256',$v),$recovery);$u->two_factor_confirmed_at=now();}
   $u->save();DB::table('audit_logs')->insert(['actor_user_id'=>$u->id,'action'=>'security.mfa_verified','auditable_type'=>'user','auditable_id'=>$u->id,'created_at'=>now(),'updated_at'=>now()]);
  });
  $r->session()->regenerate();$r->session()->put(['staff_mfa_user'=>$r->user()->id,'staff_mfa_until'=>time()+3600]);
  return response()->json(['message'=>'Authenticator verified for this session.','recovery_codes'=>$recovery]);
 }
}
