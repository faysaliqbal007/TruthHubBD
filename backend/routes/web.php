<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Named login route for Laravel internal redirects and unauthenticated redirects
Route::get('/login', fn () => response()->file(public_path('app/index.html')))->name('login');

// Email verification link from inbox (Signed URL, no auth session required)
Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
    ->name('verification.verify');

// Email verification using 6-digit numeric code
Route::post('/email/verify-code', [VerificationController::class, 'verifyCode'])
    ->middleware('throttle:10,1');

// Resend verification email notification
Route::post('/email/verification-notification', [VerificationController::class, 'resend'])
    ->middleware('throttle:6,1')
    ->name('verification.send');

// Guest-only authentication routes
Route::middleware('guest')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])->middleware('throttle:6,1');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:10,1');

    // Google OAuth
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');
});

// Password reset
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('throttle:6,1');
Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('throttle:6,1');

// Authenticated session routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
});

// Direct route to serve scam public media
Route::get('/storage/scam-media/{filename}', function ($filename) {
    if (!preg_match('/^[a-zA-Z0-9_.-]+$/', $filename)) {
        abort(400);
    }
    $path = storage_path('app/public/scam-media/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    $mime = mime_content_type($path) ?: 'image/jpeg';
    return response()->file($path, ['Content-Type' => $mime]);
});

// Serve the built React app (client/ -> public/app) for every non-API path.
Route::get('/{any?}', fn () => response()->file(public_path('app/index.html')))
    ->where('any', '(?!api/|up$).*');
