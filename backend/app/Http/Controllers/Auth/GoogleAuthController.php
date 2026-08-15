<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * Controller handling Google OAuth2 authentication flow.
 */
class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback(): RedirectResponse
    {
        $frontend = rtrim(config('app.frontend_url'), '/');

        try {
            $google = Socialite::driver('google')->user();

            if (! $google->getEmail()) {
                return redirect($frontend . '/login?oauth=missing_email');
            }

            $user = User::where('google_id', $google->getId())
                ->orWhere('email', $google->getEmail())
                ->first();

            if ($user && $user->google_id && $user->google_id !== $google->getId()) {
                return redirect($frontend . '/login?oauth=account_conflict');
            }

            if (! $user) {
                $user = User::create([
                    'name' => $google->getName() ?: 'TruthHubBD Member',
                    'email' => $google->getEmail(),
                    'email_verified_at' => now(),
                    'password' => null,
                    'avatar_url' => $google->getAvatar(),
                    'google_id' => $google->getId(),
                ]);
            } else {
                $user->forceFill([
                    'google_id' => $google->getId(),
                    'avatar_url' => $user->avatar_url ?: $google->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ])->save();
            }

            Auth::login($user, true);
            request()->session()->regenerate();

            return redirect($frontend . '/profile?oauth=success');
        } catch (Throwable $e) {
            report($e);
            return redirect($frontend . '/login?oauth=failed');
        }
    }
}
