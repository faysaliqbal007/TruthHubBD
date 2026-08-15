<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;

/**
 * Controller handling new user registration.
 * After registration, users must verify their email before logging in.
 */
class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     * Creates the account and sends a verification email.
     * The user is NOT logged in — they must verify first.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            ...$validated,
            'role' => 'user',
        ]);

        // Send email verification — user MUST verify before logging in
        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Account created! We sent a verification link to ' . $user->email . '. Please check your inbox and click the link to activate your account.',
        ], 201);
    }
}
