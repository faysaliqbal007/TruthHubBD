<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\BusinessClaimController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScamCaseController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\OperationsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Public and Protected API routes for TruthHubBD backend
*/

// Public business discovery & review API endpoints
Route::get('/directory-data', function () {
    return response()->streamDownload(function(){echo '{"license":"ODbL-1.0","attribution":"© OpenStreetMap contributors","license_url":"https://www.openstreetmap.org/copyright","data":[';$first=true;foreach(\App\Models\Business::where('source_ref','like','osm:%')->select('name','bengali_name','location','category','website','source_ref','source_url','source_fetched_at','latitude','longitude')->cursor() as $b){if(!$first)echo ',';echo $b->toJson();$first=false;}echo ']}';},'truthhubbd-osm-directory.json',['Content-Type'=>'application/json']);
})->middleware('throttle:5,1');
Route::get('/businesses', [BusinessController::class, 'index']);
Route::get('/community-overview', \App\Http\Controllers\CommunityOverviewController::class);
Route::get('/scam-national-tally', [\App\Http\Controllers\CommunityOverviewController::class, 'scamNationalTally']);
Route::post('/location/resolve', [\App\Http\Controllers\LocationResolverController::class, 'resolve']);
Route::get('/location/search', [\App\Http\Controllers\LocationResolverController::class, 'search']);
Route::get('/businesses/{slug}', [BusinessController::class, 'show']);
Route::get('/businesses/{slug}/scam-cases', [ScamCaseController::class, 'businessCases']);
Route::get('/businesses/{business}/profile-image', [\App\Http\Controllers\BusinessProfileImageController::class, 'show']);
Route::get('/reviews/recent', [BusinessController::class, 'recentReviews']);
Route::get('/reviews', \App\Http\Controllers\ReviewFeedController::class);
Route::get('/reviews/{review}', [CommunityController::class, 'show']);
Route::get('/reviews/{review}/image', [CommunityController::class, 'image']);
Route::get('/reviews/{review}/attachments/{index}', [CommunityController::class, 'attachment'])->whereNumber('index');
Route::get('/sponsored', [OperationsController::class, 'sponsored']);
Route::get('/sponsored/showcase', [OperationsController::class, 'sponsoredShowcase']);
Route::post('/sponsored/{id}/events', [OperationsController::class, 'campaignEvent'])->middleware('throttle:20,1');
Route::get('/scam-cases', [ScamCaseController::class, 'index']);
Route::get('/scam-cases/{caseCode}', [ScamCaseController::class, 'show']);
Route::get('/advertisements', [\App\Http\Controllers\AdvertisementController::class, 'index']);
Route::get('/advertisement-ticker', [\App\Http\Controllers\AdvertisementController::class, 'ticker']);

Route::get('/search/omni', [\App\Http\Controllers\OmniSearchController::class, 'search'])->middleware('throttle:60,1');

// Verification endpoints
Route::post('/email/verify-code', [\App\Http\Controllers\Auth\VerificationController::class, 'verifyCode'])->middleware('throttle:10,1');
Route::post('/email/verification-notification', [\App\Http\Controllers\Auth\VerificationController::class, 'resend'])->middleware('throttle:6,1');

// Password reset endpoints
Route::post('/forgot-password', [\App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store'])->middleware('throttle:6,1');
Route::post('/reset-password', [\App\Http\Controllers\Auth\NewPasswordController::class, 'store'])->middleware('throttle:6,1');

// Protected routes requiring Sanctum authentication
Route::middleware([
    'auth:sanctum',
    'verified',
    \App\Http\Middleware\EnsureAccountNotRestricted::class,
    'throttle:60,1',
    \App\Http\Middleware\RequireStaffMfa::class,
    \App\Http\Middleware\ScanUploads::class
])->group(function () {
    Route::get('/admin/advertisements', [\App\Http\Controllers\AdvertisementController::class, 'adminIndex']);
    Route::get('/admin/advertisement-ticker', [\App\Http\Controllers\AdvertisementController::class, 'adminTicker']);
    Route::patch('/admin/advertisement-ticker', [\App\Http\Controllers\AdvertisementController::class, 'updateTicker']);
    Route::post('/admin/advertisements', [\App\Http\Controllers\AdvertisementController::class, 'store']);
    Route::patch('/admin/advertisements/{advertisement}', [\App\Http\Controllers\AdvertisementController::class, 'update']);
    Route::post('/admin/advertisements/upload-image', [\App\Http\Controllers\AdvertisementController::class, 'uploadImage']);
    Route::get('/security/status', [\App\Http\Controllers\SecurityController::class, 'status']);
    Route::post('/security/enroll', [\App\Http\Controllers\SecurityController::class, 'enroll'])->middleware('throttle:5,1,security');
    Route::post('/security/verify', [\App\Http\Controllers\SecurityController::class, 'verify'])->middleware('throttle:5,1,security');
    Route::get('/user', fn (Request $request) => response()->json([
        'user' => array_merge($request->user()->toArray(), [
            'unread_notifications' => \DB::table('notifications')->where('user_id', $request->user()->id)->whereNull('read_at')->count(),
            'has_claimed_business' => \App\Models\Business::where('user_id', $request->user()->id)->exists()
        ])
    ]));
    Route::get('/activity', [OperationsController::class, 'activity']);
    Route::get('/admin/organization-images', [\App\Http\Controllers\BusinessProfileImageController::class, 'queue']);
    Route::get('/admin/organization-images/{organizationImage}/preview', [\App\Http\Controllers\BusinessProfileImageController::class, 'preview']);
    Route::patch('/admin/organization-images/{organizationImage}', [\App\Http\Controllers\BusinessProfileImageController::class, 'decide']);
    Route::put('/businesses/{business}/saved', [OperationsController::class, 'save']);
    Route::get('/businesses/{business}/saved', [OperationsController::class, 'savedState']);
    Route::get('/business-center', [OperationsController::class, 'center']);
    Route::put('/reviews/{review}/official-response', [OperationsController::class, 'respond']);
    Route::patch('/reviews/{review}', [OperationsController::class, 'editReview']);
    Route::delete('/reviews/{id}', [AdminController::class, 'deleteReview']);
    Route::get('/moderation/reports', [OperationsController::class, 'reports']);
    Route::patch('/moderation/content/{type}/{id}', [OperationsController::class, 'moderateContent']);
    Route::patch('/moderation/reports/{id}', [OperationsController::class, 'handleReport']);
    Route::post('/moderation/reports/{id}/respond', [OperationsController::class, 'respondToReport']);

    Route::get('/moderation/evidence/{evidence}', [OperationsController::class, 'evidence']);
    Route::get('/moderation/reviews/{review}/attachments', [OperationsController::class, 'reviewAttachments']);
    Route::get('/moderation/reviews/{review}/attachments/{index}', [OperationsController::class, 'reviewAttachment'])->whereNumber('index');
    Route::get('/admin/claim-evidence/{businessClaim}', [OperationsController::class, 'claimEvidence']);
    Route::post('/admin/businesses/{business}/merge', [OperationsController::class, 'merge']);
    Route::get('/admin/appeals', [OperationsController::class, 'appeals']);
    Route::patch('/admin/appeals/{id}', [OperationsController::class, 'decideAppeal']);
    Route::get('/admin/audit-logs', [OperationsController::class, 'auditLog']);
    Route::get('/admin/campaigns', [OperationsController::class, 'campaigns']);
    Route::post('/admin/campaigns', [OperationsController::class, 'createCampaign']);
    Route::patch('/admin/campaigns/{id}', [OperationsController::class, 'updateCampaign']);
    Route::post('/scam-cases/{scamCase}/appeals', [OperationsController::class, 'appeal']);
    Route::post('/scam-cases/{scamCase}/evidence', [ScamCaseController::class, 'addEvidence']);
    Route::post('/scam-cases/{scamCase}/subject-response', [ScamCaseController::class, 'subjectResponse']);
    Route::post('/scam-cases/{scamCase}/resolve', [ScamCaseController::class, 'resolve']);
    Route::get('/my-cases/{caseCode}', [ScamCaseController::class, 'myCase']);
    Route::patch('/profile', [ProfileController::class, 'update']);

    // Business owner profile editing & reviews
    Route::patch('/businesses/{id}', [BusinessController::class, 'update']);
    Route::post('/businesses/{id}/reviews', [BusinessController::class, 'storeReview']);
    Route::post('/reviews/{review}/comments', [CommunityController::class, 'comment']);
    Route::put('/reviews/{review}/reaction', [CommunityController::class, 'react']);
    Route::post('/reports', [CommunityController::class, 'report']);
    Route::get('/notifications', [CommunityController::class, 'notifications']);
    Route::patch('/notifications/{id}/read', [CommunityController::class, 'markRead']);
    Route::post('/businesses', [BusinessController::class, 'store']);
    Route::post('/businesses/{business}/scam-cases', [ScamCaseController::class, 'store']);
    Route::post('/businesses/{business}/claims', [BusinessClaimController::class, 'store']);
    Route::get('/moderation/scam-cases', [ScamCaseController::class, 'queue']);
    Route::patch('/moderation/scam-cases/{scamCase}', [ScamCaseController::class, 'transition']);
    Route::get('/admin/business-claims', [BusinessClaimController::class, 'queue']);
    Route::patch('/admin/business-claims/{businessClaim}', [BusinessClaimController::class, 'decide']);

    // The launch team has one moderator and one admin. These endpoints are
    // deliberately guarded in the controller as well as by the session.
    Route::get('/admin/pending-businesses', [AdminController::class, 'pendingBusinesses']);
    Route::patch('/admin/businesses/{business}/facts',[\App\Http\Controllers\DirectoryCorrectionController::class,'update']);
    Route::post('/admin/businesses/{id}/approve', [AdminController::class, 'approve']);
    Route::post('/admin/businesses/{id}/reject', [AdminController::class, 'reject']);
    Route::get('/admin/metrics', [AdminController::class, 'metrics']);
    Route::get('/admin/lookup', [AdminController::class, 'lookup']);
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateUserRole']);
    Route::patch('/admin/users/{id}/restrict', [AdminController::class, 'toggleUserRestriction']);
    Route::patch('/admin/users/{id}/claim-access', [AdminController::class, 'toggleClaimAccess']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
    Route::delete('/admin/reviews/{id}', [AdminController::class, 'deleteReview']);
    Route::delete('/admin/scam-cases/{id}', [AdminController::class, 'deleteScamCase']);
    Route::post('/admin/broadcast-notification', [AdminController::class, 'broadcastNotification']);
    Route::post('/admin/users/{id}/verify-email', [AdminController::class, 'verifyUserEmail']);
    Route::get('/admin/businesses/{id}/details', [AdminController::class, 'getOrganization']);
    Route::get('/admin/businesses', [AdminController::class, 'allBusinesses']);
    Route::patch('/admin/businesses/{id}/edit', [AdminController::class, 'editOrganization']);
    Route::delete('/admin/businesses/{id}', [AdminController::class, 'deleteOrganization']);
    Route::patch('/admin/scam-cases/{id}/alert', [AdminController::class, 'toggleCaseAlert']);
});
