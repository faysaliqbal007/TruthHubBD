<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

/**
 * Controller handling password reset form submissions via 6-digit code or link.
 */
class NewPasswordController extends Controller
{
    /**
     * Handle an incoming new password request.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'confirmed', Rules\Password::defaults()],
            'code'                  => ['sometimes', 'nullable', 'string'],
            'token'                 => ['sometimes', 'nullable', 'string'],
        ]);

        $submittedCode = trim((string) ($request->code ?? $request->token));
        if (empty($submittedCode)) {
            throw ValidationException::withMessages([
                'code' => ['The 6-digit verification code is required to reset your password.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email address.'],
            ]);
        }

        $isCodeValid = false;

        // 1. Check against user's verification_code
        if (! empty($user->verification_code) && hash_equals((string) $user->verification_code, $submittedCode)) {
            if ($user->verification_code_expires_at && Carbon::parse($user->verification_code_expires_at)->isPast()) {
                throw ValidationException::withMessages([
                    'code' => ['This password reset code has expired (15-min limit). Please request a new code.'],
                ]);
            }
            $isCodeValid = true;
        }

        // 2. Fallback check against password_reset_tokens table
        if (! $isCodeValid) {
            $record = DB::table('password_reset_tokens')->where('email', $user->email)->first();
            if ($record) {
                $tokenMatches = Hash::check($submittedCode, $record->token) || hash_equals((string) $record->token, $submittedCode);
                $isFresh = Carbon::parse($record->created_at)->addMinutes(15)->isFuture();
                if ($tokenMatches && $isFresh) {
                    $isCodeValid = true;
                }
            }
        }

        if (! $isCodeValid) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is incorrect or expired. Please check your inbox and try again.'],
            ]);
        }

        // Successfully reset password
        $user->forceFill([
            'password'                     => Hash::make($request->password),
            'email_verified_at'            => $user->email_verified_at ?: now(),
            'verification_code'            => null,
            'verification_code_expires_at' => null,
            'remember_token'               => Str::random(60),
        ])->save();

        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return response()->json([
            'message' => 'Your password has been successfully reset! You can now log in with your new password.',
        ]);
    }
}
