<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PasswordResetWithCodeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Controller handling password reset code requests.
 */
class PasswordResetLinkController extends Controller
{
    /**
     * Send a 6-digit password reset verification code to the given user's email address.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found with this email address. Please check spelling or register.',
            ], 422);
        }

        // Generate 6-digit verification code
        $code = sprintf('%06d', random_int(100000, 999999));

        $user->forceFill([
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        // Also record in password_reset_tokens for standard verification support
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token'      => Hash::make($code),
                'created_at' => now(),
            ]
        );

        $user->notify(new PasswordResetWithCodeNotification($code));

        return response()->json([
            'message' => 'A 6-digit password reset code has been sent to ' . $user->email . '. It will expire in 15 minutes.',
            'email'   => $user->email,
        ]);
    }
}
