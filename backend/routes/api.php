<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BusinessClaimController;
use App\Http\Controllers\ScamCaseController;
use App\Http\Controllers\AdvertisementController;
use App\Http\Controllers\LocationResolverController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Public and Protected API routes for TruthHubBD backend
*/

// Public business discovery & review API endpoints
Route::get('/businesses', [BusinessController::class, 'index']);
Route::get('/businesses/{slug}', [BusinessController::class, 'show']);
Route::get('/businesses/{slug}/scam-cases', [ScamCaseController::class, 'businessCases']);
Route::get('/reviews/recent', [BusinessController::class, 'recentReviews']);
Route::post('/businesses', [BusinessController::class, 'store']); // Business creation (Pending admin approval)

// Public spatial location resolver endpoints
Route::post('/location/resolve', [LocationResolverController::class, 'resolve']);
Route::get('/location/search', [LocationResolverController::class, 'search']);

// Public scam case registry endpoints
Route::get('/scam-cases', [ScamCaseController::class, 'index']);
Route::get('/scam-cases/{caseCode}', [ScamCaseController::class, 'show']);

// Public advertisements and announcements ticker endpoints
Route::get('/advertisements', [AdvertisementController::class, 'index']);
Route::get('/advertisement-ticker', [AdvertisementController::class, 'ticker']);

// Admin approval workflow endpoints (/admin)
Route::get('/admin/pending-businesses', [AdminController::class, 'pendingBusinesses']);
Route::post('/admin/businesses/{id}/approve', [AdminController::class, 'approve']);
Route::post('/admin/businesses/{id}/reject', [AdminController::class, 'reject']);

// Protected routes requiring Sanctum authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => response()->json(['user' => $request->user()]));
    Route::patch('/profile', [ProfileController::class, 'update']);

    // Advertisement administration endpoints
    Route::get('/admin/advertisements', [AdvertisementController::class, 'adminIndex']);
    Route::get('/admin/advertisement-ticker', [AdvertisementController::class, 'adminTicker']);
    Route::patch('/admin/advertisement-ticker', [AdvertisementController::class, 'updateTicker']);
    Route::post('/admin/advertisements', [AdvertisementController::class, 'store']);
    Route::patch('/admin/advertisements/{advertisement}', [AdvertisementController::class, 'update']);
    Route::post('/admin/advertisements/upload-image', [AdvertisementController::class, 'uploadImage']);

    // Business owner profile editing & reviews
    Route::patch('/businesses/{id}', [BusinessController::class, 'update']);
    Route::post('/businesses/{id}/reviews', [BusinessController::class, 'storeReview']);

    // Business claim lifecycle endpoints
    Route::post('/businesses/{business}/claims', [BusinessClaimController::class, 'store']);
    Route::get('/admin/business-claims', [BusinessClaimController::class, 'queue']);
    Route::patch('/admin/business-claims/{businessClaim}', [BusinessClaimController::class, 'decide']);

    // Scam case report lifecycle & resolution endpoints
    Route::post('/businesses/{business}/scam-cases', [ScamCaseController::class, 'store']);
    Route::get('/moderation/scam-cases', [ScamCaseController::class, 'queue']);
    Route::patch('/moderation/scam-cases/{scamCase}', [ScamCaseController::class, 'transition']);
    Route::post('/scam-cases/{scamCase}/evidence', [ScamCaseController::class, 'addEvidence']);
    Route::post('/scam-cases/{scamCase}/subject-response', [ScamCaseController::class, 'subjectResponse']);
    Route::post('/scam-cases/{scamCase}/resolve', [ScamCaseController::class, 'resolve']);
    Route::get('/my-cases/{caseCode}', [ScamCaseController::class, 'myCase']);
});
