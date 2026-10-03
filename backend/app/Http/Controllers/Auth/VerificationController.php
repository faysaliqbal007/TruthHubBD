<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Controller handling email address verification via 6-digit code and signed links.
 */
class VerificationController extends Controller
{
    /**
     * Verify email using 6-digit verification code.
     */
    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'code'  => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found with this email address. Please register first.',
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified. You can log in right now.',
                'already_verified' => true,
            ], 200);
        }

        $submittedCode = trim((string) $request->code);

        if (empty($user->verification_code) || ! hash_equals((string) $user->verification_code, $submittedCode)) {
            return response()->json([
                'message' => 'The verification code is incorrect. Please check your inbox and enter the 6-digit code.',
            ], 422);
        }

        if ($user->verification_code_expires_at && Carbon::parse($user->verification_code_expires_at)->isPast()) {
            return response()->json([
                'message' => 'This verification code has expired (15-min limit). Please request a new code.',
            ], 422);
        }

        // Successfully verified
        $user->markEmailAsVerified();
        $user->forceFill([
            'verification_code' => null,
            'verification_code_expires_at' => null,
        ])->save();

        event(new Verified($user));

        // Automatically establish session login
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Email successfully verified! Welcome to TruthHubBD.',
            'user'    => $user,
        ], 200);
    }

    /**
     * Mark the user's email address as verified from the signed email link.
     */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $frontend = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $user = User::find($id);
        $emailParam = $user ? '&email=' . urlencode($user->email) : '';

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            return redirect($frontend . '/login?verified=invalid');
        }

        // If link has expired or signature is invalid
        if (! $request->hasValidSignature()) {
            return redirect($frontend . '/login?verified=expired' . $emailParam);
        }

        if ($user->hasVerifiedEmail()) {
            return redirect($frontend . '/login?verified=already');
        }

        if ($user->markEmailAsVerified()) {
            $user->forceFill([
                'verification_code' => null,
                'verification_code_expires_at' => null,
            ])->save();

            event(new Verified($user));
        }

        return redirect($frontend . '/login?verified=1');
    }

    /**
     * Resend the email verification notification with a new 6-digit code.
     */
    public function resend(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found with that email address. Please register first.',
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified. You can log in right now.',
            ], 200);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'A new 6-digit verification code has been sent to ' . $user->email . '. It will expire in 15 minutes.',
        ]);
    }
}
