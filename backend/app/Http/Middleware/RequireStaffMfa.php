<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class RequireStaffMfa {
 public function handle(Request $r,Closure $next){
  if(config('trust.staff_mfa_required') && in_array($r->user()?->role,['admin','moderator'],true) && !$r->is('api/user','api/profile','api/security/*')){
   if(!$r->hasSession() || !$r->user()->two_factor_confirmed_at || (int)$r->session()->get('staff_mfa_user')!==$r->user()->id || (int)$r->session()->get('staff_mfa_until')<time())return response()->json(['message'=>'Verify your authenticator at Account Security before opening staff tools.','requires_mfa'=>true],403);
  }
  return $next($r);
 }
}
