<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controller handling user authentication sessions (login and logout).
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     * Blocks login if email has not been verified.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        // Block unverified email/password accounts from logging in
        if (! $request->user()->hasVerifiedEmail()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Please verify your email address before logging in. Check your inbox for the verification link.',
                'errors'  => [
                    'email' => ['Email address not yet verified. Please check your inbox.'],
                ],
            ], 403);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
