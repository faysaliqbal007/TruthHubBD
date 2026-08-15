<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleAuthController extends Controller
{
    public function redirect(): SymfonyRedirectResponse|RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable) {
            return redirect("{$frontendUrl}/login?error=google_auth_failed");
        }

        $user = User::query()->where('google_id', $googleUser->getId())->first();

        if (! $user && $googleUser->getEmail()) {
            $user = User::query()->where('email', $googleUser->getEmail())->first();
        }

        if ($user) {
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $user->avatar_url ?: $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ]);
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: 'TruthHub User',
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'password' => null,
                'role' => 'user',
            ]);
        }

        Auth::login($user, true);

        return redirect("{$frontendUrl}/auth/callback?status=success");
    }
}
