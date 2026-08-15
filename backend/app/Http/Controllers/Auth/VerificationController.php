<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Controller handling email address verification.
 */
class VerificationController extends Controller
{
    /**
     * Mark the user's email address as verified from the signed email link.
     * Links expire after 5 minutes.
     */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $frontend = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $user = User::find($id);
        $emailParam = $user ? '&email=' . urlencode($user->email) : '';

        // If link has expired or signature is invalid (after 5 minutes)
        if (! $request->hasValidSignature()) {
            return redirect($frontend . '/login?verified=expired' . $emailParam);
        }

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            return redirect($frontend . '/login?verified=invalid');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect($frontend . '/login?verified=already');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect($frontend . '/login?verified=1');
    }

    /**
     * Resend the email verification notification for a given email address.
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
            'message' => 'A new verification link has been sent to ' . $user->email . '. It will expire in 5 minutes.',
        ]);
    }
}
