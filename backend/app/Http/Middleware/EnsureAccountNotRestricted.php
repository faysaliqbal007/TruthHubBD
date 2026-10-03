<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureAccountNotRestricted
{
    /**
     * Terminate session and block access if the authenticated account has been restricted.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->is_restricted) {
            if ($request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            $reason = $user->restricted_reason ?: 'Your account has been restricted by an administrator.';

            return response()->json([
                'message' => $reason,
                'is_restricted' => true,
            ], 403);
        }

        return $next($request);
    }
}
