<?php

namespace App\Http\Controllers;

use App\Models\Business;
use Illuminate\Http\Request;

/**
 * AdminController
 * Handles approval workflow for business accounts submitted by users.
 * Accessible directly at /admin and via API endpoints /api/admin/*
 */
class AdminController extends Controller
{
    private function authorizeAdmin(Request $request)
    {
        if (!$request->user() || !in_array($request->user()->role, ['admin','moderator'], true)) {
            abort(403, 'Admin access is required for this action.');
        }
    }
    /**
     * Get all pending business creation requests.
     */
    public function pendingBusinesses(Request $request)
    {
        $this->authorizeAdmin($request);
        $request->validate(['page'=>'nullable|integer|min:1', 'per_page'=>'nullable|integer|min:1|max:100', 'q'=>'nullable|string|max:255']);
        $query = Business::query()->where('status', 'pending');
        if ($request->filled('q')) $query->where(fn ($q) => $q->where('name', 'like', '%'.$request->q.'%')->orWhere('slug', 'like', '%'.$request->q.'%')->orWhere('id', $request->q));
        $page = $query->orderBy('created_at')->orderBy('id')->paginate($request->integer('per_page', 25));
        $creators = \App\Models\User::whereIn('id', $page->getCollection()->pluck('created_by_user_id')->filter())->get(['id','name','email'])->keyBy('id');
        $pending = $page->getCollection()->map(function ($b) use ($creators) {
                $creator = $creators->get($b->created_by_user_id);
                return [
                    'id' => $b->id,
                    'slug' => $b->slug,
                    'name' => $b->name,
                    'bengaliName' => $b->bengali_name,
                    'category' => $b->category,
                    'description' => $b->description,
                    'location' => $b->location,
                    'phone' => $b->phone,
                    'website' => $b->website,
                    'facebookUrl' => $b->facebook_url,
                    'status' => $b->status,
                    'createdAt' => $b->created_at ? $b->created_at->format('Y-m-d H:i:s') : date('Y-m-d H:i:s'),
                    'creator' => $creator ? [
                        'id' => $creator->id,
                        'name' => $creator->name,
                        'email' => $creator->email,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'count' => $pending->count(),
            'data' => $pending,
            'pagination' => \Illuminate\Support\Arr::only($page->toArray(), ['current_page','per_page','total','last_page','from','to']),
        ]);
    }

    /**
     * Approve a pending business creation request.
     */
    public function approve(Request $request, $id)
    {
        $this->authorizeAdmin($request);
        $business = $this->decide($request, $id, 'approved');

        return response()->json([
            'success' => true,
            'message' => 'Organization listing approved.',
            'data' => $business,
        ]);
    }

    /**
     * Reject a pending business creation request.
     */
    public function reject(Request $request, $id)
    {
        $this->authorizeAdmin($request);
        $business = $this->decide($request, $id, 'rejected');

        return response()->json([
            'success' => true,
            'message' => 'Organization listing rejected.',
            'data' => $business,
        ]);
    }

    private function decide(Request $request, $id, string $status): Business
    {
        $data = $request->validate(['reason'=>'required|string|min:10|max:2000']);
        return \DB::transaction(function () use ($request, $id, $status, $data) {
            $business = Business::whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($business->status === 'pending', 409, 'This listing has already been reviewed. Refresh the queue.');
            $business->update(['status'=>$status]);
            if ($status === 'approved') {
                $pendingImage = \App\Models\BusinessProfileImage::where('business_id', $business->id)->where('status', 'pending')->latest('id')->first();
                if ($pendingImage) {
                    $pendingImage->update(['status' => 'approved']);
                    $business->update(['image' => '/api/businesses/' . $business->id . '/profile-image']);
                }
            }
            \DB::table('audit_logs')->insert(['actor_user_id'=>$request->user()->id,'action'=>'entity.'.$status,'auditable_type'=>Business::class,'auditable_id'=>$business->id,'metadata'=>json_encode(['previous_status'=>'pending','reason'=>trim($data['reason'])]),'ip_address'=>$request->ip(),'created_at'=>now(),'updated_at'=>now()]);
            return $business;
        });
    }

    public function metrics(Request $request)
    {
        $this->authorizeAdmin($request);
        return response()->json([
            'pending_organizations' => Business::where('status', 'pending')->count(),
            'pending_images' => \App\Models\BusinessProfileImage::where('status', 'pending')->count(),
            'cases_under_review' => \DB::table('scam_cases')->whereIn('status', ['under_review', 'needs_evidence', 'disputed'])->count(),
            'total_cases' => \DB::table('scam_cases')->count(),
            'pending_claims' => \DB::table('business_claims')->where('status', 'submitted')->count(),
            'open_reports' => \DB::table('content_reports')->where('status', 'open')->count(),
            'pending_appeals' => \DB::table('appeals')->where('status', 'submitted')->count(),
            'active_ads' => \DB::table('advertisements')->where('status', 'published')->count(),
            'total_users' => \DB::table('users')->count(),
            'total_businesses' => Business::where('status', 'approved')->count(),
        ]);
    }

    public function users(Request $request)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
        $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'role' => 'nullable|string|in:all,admin,moderator,user,business',
            'q' => 'nullable|string|max:255'
        ]);

        $query = \App\Models\User::with('business:id,user_id,name,bengali_name,slug,category,status');
        if ($request->filled('role') && $request->role !== 'all') {
            if ($request->role === 'business') {
                $query->where(fn($sub) => $sub->where('role', 'business')->orWhereHas('business'));
            } else {
                $query->where('role', $request->role);
            }
        }
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                if (is_numeric($q)) {
                    $sub->where('id', $q);
                }
                $sub->orWhere('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhereHas('business', fn($b) => $b->where('name', 'like', "%{$q}%")->orWhere('slug', 'like', "%{$q}%"));
            });
        }

        $page = $query->orderByDesc('id')->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => $page->items(),
            'pagination' => \Illuminate\Support\Arr::only($page->toArray(), ['current_page', 'per_page', 'total', 'last_page', 'from', 'to']),
        ]);
    }

    public function updateUserRole(Request $request, $id)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
        $data = $request->validate([
            'role' => 'required|in:admin,moderator,user,business',
            'reason' => 'nullable|string|max:500'
        ]);

        $user = \App\Models\User::findOrFail($id);

        if ($user->id === $request->user()->id && $data['role'] !== 'admin') {
            abort(422, 'You cannot remove your own administrator access.');
        }

        $oldRole = $user->role;
        $user->role = $data['role'];
        $user->save();

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'user.role_updated',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => $user->id,
            'metadata' => json_encode([
                'user_email' => $user->email,
                'old_role' => $oldRole,
                'new_role' => $data['role'],
                'reason' => $data['reason'] ?? 'Role updated by admin'
            ]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => "User role updated to {$data['role']}.",
            'user' => $user
        ]);
    }

    public function verifyUserEmail(Request $request, $id)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
        $user = \App\Models\User::findOrFail($id);

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified.', 'user' => $user]);
        }

        $user->email_verified_at = now();
        $user->save();

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'user.email_verified_by_admin',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => $user->id,
            'metadata' => json_encode(['email' => $user->email]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => "User email {$user->email} verified.",
            'user' => $user
        ]);
    }

    public function lookup(Request $request)
    {
        $this->authorizeAdmin($request);
        $raw = trim($request->string('q', ''));
        if ($raw === '') {
            return response()->json(['success' => true, 'data' => []]);
        }
        $q = ltrim($raw, '#');
        $isNumeric = is_numeric($q);
        $results = [];

        // 1. Cases (by ID, case_code, title)
        $caseQuery = \App\Models\ScamCase::with('business:id,name,slug');
        if ($isNumeric) {
            $caseQuery->where('id', (int)$q);
        } else {
            $caseQuery->where(function($sq) use ($raw, $q) {
                $sq->where('case_code', 'like', "%{$q}%")
                   ->orWhere('title', 'like', "%{$raw}%");
            });
        }
        foreach ($caseQuery->limit(8)->get() as $case) {
            $results[] = [
                'type' => 'case',
                'id' => $case->id,
                'code' => $case->case_code,
                'title' => $case->title ?: "Case #{$case->id}",
                'subtitle' => ($case->business ? $case->business->name . ' · ' : '') . str_replace('_', ' ', $case->status),
                'status' => $case->status,
                'admin_url' => "/moderation?q={$case->id}",
                'public_url' => "/scam-alerts/" . ($case->business ? $case->business->slug : $case->id),
            ];
        }

        // 2. Reviews (by ID, title)
        $reviewQuery = \App\Models\Review::with('business:id,name,slug');
        if ($isNumeric) {
            $reviewQuery->where('id', (int)$q);
        } else {
            $reviewQuery->where('title', 'like', "%{$raw}%")
                ->orWhereHas('business', fn($b) => $b->where('name', 'like', "%{$raw}%"));
        }
        foreach ($reviewQuery->limit(8)->get() as $review) {
            $results[] = [
                'type' => 'review',
                'id' => $review->id,
                'code' => "REV-{$review->id}",
                'title' => $review->title ?: "Review #{$review->id}",
                'subtitle' => ($review->business ? $review->business->name . ' · ' : '') . "Rating: {$review->rating}/5 · " . $review->status,
                'status' => $review->status,
                'admin_url' => "/moderation/reports?tab=moderation&id={$review->id}",
                'public_url' => "/reviews/{$review->id}",
            ];
        }

        // 3. Content Reports (by ID, reportable_id, reason)
        $reportQuery = \DB::table('content_reports');
        if ($isNumeric) {
            $reportQuery->where('id', (int)$q)->orWhere('reportable_id', (int)$q);
        } else {
            $reportQuery->where('reason', 'like', "%{$raw}%")->orWhere('details', 'like', "%{$raw}%");
        }
        foreach ($reportQuery->limit(8)->get() as $report) {
            $results[] = [
                'type' => 'report',
                'id' => $report->id,
                'code' => "REP-{$report->id}",
                'title' => "Report #{$report->id}: {$report->reportable_type} #{$report->reportable_id}",
                'subtitle' => $report->reason . ' · ' . $report->status,
                'status' => $report->status,
                'admin_url' => "/moderation/reports?q={$report->id}",
            ];
        }

        // 4. Businesses (by ID, name, slug)
        $bizQuery = \App\Models\Business::query();
        if ($isNumeric) {
            $bizQuery->where('id', (int)$q);
        } else {
            $bizQuery->where('name', 'like', "%{$raw}%")->orWhere('slug', 'like', "%{$raw}%");
        }
        foreach ($bizQuery->limit(8)->get() as $biz) {
            $results[] = [
                'type' => 'business',
                'id' => $biz->id,
                'code' => "BIZ-{$biz->id}",
                'title' => $biz->name,
                'subtitle' => $biz->category . ' · ' . $biz->location . ' · ' . $biz->status,
                'status' => $biz->status,
                'admin_url' => "/admin/organizations?q={$biz->id}",
                'public_url' => "/business/{$biz->slug}",
            ];
        }

        // 5. Users (by ID, name, email)
        if ($request->user()?->role === 'admin') {
            $userQuery = \App\Models\User::query();
            if ($isNumeric) {
                $userQuery->where('id', (int)$q);
            } else {
                $userQuery->where('name', 'like', "%{$raw}%")->orWhere('email', 'like', "%{$raw}%");
            }
            foreach ($userQuery->limit(8)->get() as $u) {
                $results[] = [
                    'type' => 'user',
                    'id' => $u->id,
                    'code' => "USER-{$u->id}",
                    'title' => $u->name,
                    'subtitle' => $u->email . ' · Role: ' . $u->role,
                    'status' => $u->role,
                    'admin_url' => "/admin/users?q={$u->id}",
                ];
            }
        }

        return response()->json(['success' => true, 'data' => $results]);
    }

    public function toggleUserRestriction(Request $request, $id)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
        $data = $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        $user = \App\Models\User::findOrFail($id);
        if ($user->id === $request->user()->id) {
            abort(422, 'You cannot restrict your own account.');
        }

        $user->is_restricted = !$user->is_restricted;
        $user->restricted_reason = $user->is_restricted ? ($data['reason'] ?? 'Restricted by administrator') : null;
        $user->save();

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => $user->is_restricted ? 'user.restricted' : 'user.unrestricted',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => $user->id,
            'metadata' => json_encode(['email' => $user->email, 'reason' => $user->restricted_reason]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $user->is_restricted ? "User {$user->email} has been restricted." : "User {$user->email} restriction lifted.",
            'user' => $user
        ]);
    }

    public function toggleClaimAccess(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $data = $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        $user = \App\Models\User::findOrFail($id);
        $user->claim_blocked = !$user->claim_blocked;
        $user->claim_blocked_reason = $user->claim_blocked ? ($data['reason'] ?? 'Blocked from claiming organizations by administrator.') : null;
        $user->save();

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => $user->claim_blocked ? 'user.claim_blocked' : 'user.claim_unblocked',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => $user->id,
            'metadata' => json_encode(['email' => $user->email, 'reason' => $user->claim_blocked_reason]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'claim_blocked' => $user->claim_blocked,
            'claim_blocked_reason' => $user->claim_blocked_reason,
            'message' => $user->claim_blocked ? "User {$user->email} is now restricted from claiming organizations." : "User {$user->email} can now claim organizations.",
            'user' => $user
        ]);
    }

    public function deleteUser(Request $request, $id)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
        $user = \App\Models\User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            abort(422, 'You cannot delete your own account.');
        }

        $email = $user->email;
        $userId = $user->id;

        \DB::transaction(function () use ($user) {
            // Nullify or delete related entries
            \DB::table('notifications')->where('user_id', $user->id)->delete();
            \DB::table('review_reactions')->where('user_id', $user->id)->delete();
            \DB::table('review_comments')->where('user_id', $user->id)->delete();
            $user->delete();
        });

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'user.deleted',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => $userId,
            'metadata' => json_encode(['email' => $email]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "User account {$email} has been permanently deleted."
        ]);
    }

    public function deleteReview(Request $request, $id)
    {
        $review = \App\Models\Review::findOrFail($id);
        $user = $request->user();
        $isStaff = in_array($user?->role, ['admin', 'moderator'], true);
        $isOwner = $user && (int)$review->user_id === (int)$user->id;
        abort_unless($isStaff || $isOwner, 403, 'You are not authorized to delete this review.');
        if (!$isStaff && $isOwner && $review->created_at && $review->created_at->diffInMinutes(now()) > 180) {
            abort(403, 'Reviews cannot be deleted after 3 hours of submission.');
        }
        $businessId = $review->business_id;

        \DB::transaction(function () use ($review, $businessId) {
            \DB::table('review_comments')->where('review_id', $review->id)->delete();
            \DB::table('review_reactions')->where('review_id', $review->id)->delete();
            if (\Illuminate\Support\Facades\Schema::hasTable('review_versions')) {
                \DB::table('review_versions')->where('review_id', $review->id)->delete();
            }
            \DB::table('content_reports')->where('reportable_type', 'review')->where('reportable_id', $review->id)->delete();
            $review->delete();

            if ($businessId) {
                $biz = \App\Models\Business::find($businessId);
                if ($biz) {
                    $published = \App\Models\Review::where('business_id', $businessId)->where('status', 'published');
                    $count = $published->count();
                    $avg = $count > 0 ? round($published->avg('rating'), 2) : 0;
                    $biz->update(['rating' => $avg, 'review_count' => $count]);
                }
            }
        });

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'review.deleted',
            'auditable_type' => \App\Models\Review::class,
            'auditable_id' => $id,
            'metadata' => json_encode(['review_id' => $id, 'business_id' => $businessId]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Review #{$id} has been permanently deleted."
        ]);
    }

    public function deleteScamCase(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $case = \App\Models\ScamCase::findOrFail($id);
        $code = $case->case_code;

        \DB::transaction(function () use ($case) {
            if (\Illuminate\Support\Facades\Schema::hasTable('scam_case_events')) {
                \DB::table('scam_case_events')->where('scam_case_id', $case->id)->delete();
            }
            \DB::table('content_reports')->where('reportable_type', 'scam_case')->where('reportable_id', $case->id)->delete();
            \DB::table('notifications')->where('type', 'case_alert')->where('url', 'like', "%{$case->case_code}%")->delete();
            $case->delete();
        });

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'scam_case.deleted',
            'auditable_type' => \App\Models\ScamCase::class,
            'auditable_id' => $id,
            'metadata' => json_encode(['case_code' => $code]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Scam case {$code} has been permanently deleted."
        ]);
    }

    public function broadcastNotification(Request $request)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
        $body = $request->input('body', $request->input('message'));
        $url = $request->input('url', $request->input('action_url'));
        $request->merge(['body' => $body, 'url' => $url]);
        $data = $request->validate([
            'title' => 'required|string|max:150',
            'body' => 'required|string|max:2000',
            'url' => 'nullable|string|max:500',
            'target_role' => 'nullable|string|max:50', // Allows all, roles, or a specific numeric user ID
        ]);

        $query = \App\Models\User::query();
        if (!empty($data['target_role']) && $data['target_role'] !== 'all') {
            if ($data['target_role'] === 'business') {
                $query->where(fn($sub) => $sub->where('role', 'business')->orWhereHas('business'));
            } elseif (is_numeric($data['target_role'])) {
                $query->where('id', $data['target_role']);
            } else {
                $query->where('role', $data['target_role']);
            }
        }

        $userIds = $query->pluck('id');
        $timestamp = now();
        $inserted = 0;

        foreach ($userIds->chunk(300) as $chunk) {
            $rows = $chunk->map(fn($uid) => [
                'user_id' => $uid,
                'type' => 'announcement',
                'title' => trim($data['title']),
                'body' => trim($data['body']),
                'url' => $data['url'] ? trim($data['url']) : null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ])->all();
            \DB::table('notifications')->insert($rows);
            $inserted += count($rows);
            
            \App\Jobs\SendPushNotification::dispatch($chunk->toArray(), trim($data['title']), trim($data['body']), $data['url'] ? trim($data['url']) : null);
        }

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'admin.notification_broadcast',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => $request->user()->id,
            'metadata' => json_encode([
                'title' => $data['title'],
                'target_role' => $data['target_role'] ?? 'all',
                'recipients_count' => $inserted,
            ]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'count' => $inserted,
            'message' => "Notification broadcast delivered to {$inserted} user(s).",
        ]);
    }

    /**
     * Get a single organization by ID for admin editing.
     */
    public function getOrganization(Request $request, $id)
    {
        $this->authorizeAdmin($request);
        $business = Business::findOrFail($id);
        return response()->json(['success' => true, 'data' => $business]);
    }

    /**
     * Full admin edit of an organization - name, category, location, description,
     * phone, website, facebook, operating status, Bengali name, etc.
     * No report_id required unlike the directory correction endpoint.
     */
    public function editOrganization(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $data = $request->validate([
            'name'             => 'nullable|string|max:255',
            'bengali_name'     => 'nullable|string|max:255',
            'category'         => 'nullable|in:Products,Businesses & Services,Doctors & Professionals,Hospitals & Clinics,Universities & Education,Courier & Digital Services',
            'description'      => 'nullable|string|max:5000',
            'location'         => 'nullable|string|max:255',
            'phone'            => 'nullable|string|max:50',
            'website'          => 'nullable|url|max:500',
            'facebook_url'     => 'nullable|url|max:500',
            'image'            => 'nullable|string|max:30000000',
            'file'             => 'nullable|file|max:15360',
            'verified'         => 'nullable|boolean',
            'status'           => 'nullable|in:approved,pending,rejected',
            'operating_status' => 'nullable|in:unknown,open,closed',
            'reason'           => 'nullable|string|max:2000',
        ]);

        if ($request->hasFile('file') || $request->hasFile('image')) {
            $file = $request->file('file') ?? $request->file('image');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = \Illuminate\Support\Str::uuid() . '.' . $ext;
            $file->storeAs('organization-profile-images', $filename, 'public');
            $storedPath = $file->storeAs('organization-profile-images', $filename, 'private');
            \App\Models\BusinessProfileImage::where('business_id', $id)->where('status', 'approved')->update(['status' => 'superseded']);
            \App\Models\BusinessProfileImage::create([
                'business_id' => $id,
                'uploaded_by_user_id' => $request->user()->id,
                'storage_path' => $storedPath,
                'mime_type' => $file->getMimeType(),
                'bytes' => $file->getSize(),
                'sha256' => hash_file('sha256', $file->getRealPath()),
                'publication_consent' => true,
                'status' => 'approved',
            ]);
            $data['image'] = '/api/businesses/' . $id . '/profile-image';
        } elseif (!empty($data['image']) && preg_match('/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/', $data['image'], $matches)) {
            $rawMime = strtolower($matches[1]);
            $ext = match($rawMime) {
                'jpeg', 'jpg' => 'jpg',
                'png' => 'png',
                'webp' => 'webp',
                'gif' => 'gif',
                'svg+xml', 'svg' => 'svg',
                'avif' => 'avif',
                default => 'jpg',
            };
            $decoded = base64_decode($matches[2]);
            if ($decoded !== false) {
                $filename = \Illuminate\Support\Str::uuid() . '.' . $ext;
                \Illuminate\Support\Facades\Storage::disk('public')->put('organization-profile-images/' . $filename, $decoded);
                \Illuminate\Support\Facades\Storage::disk('private')->put('organization-profile-images/' . $filename, $decoded);
                
                \App\Models\BusinessProfileImage::where('business_id', $id)->where('status', 'approved')->update(['status' => 'superseded']);
                \App\Models\BusinessProfileImage::create([
                    'business_id' => $id,
                    'uploaded_by_user_id' => $request->user()->id,
                    'storage_path' => 'organization-profile-images/' . $filename,
                    'mime_type' => 'image/' . $ext,
                    'bytes' => strlen($decoded),
                    'sha256' => hash('sha256', $decoded),
                    'publication_consent' => true,
                    'status' => 'approved',
                ]);
                $data['image'] = '/api/businesses/' . $id . '/profile-image';
            }
        }

        \DB::transaction(function () use ($request, $id, $data) {
            $business = Business::whereKey($id)->lockForUpdate()->firstOrFail();
            $fields = ['name','bengali_name','category','description','location','phone','website','facebook_url','image','verified','status','operating_status'];
            $before = $business->only($fields);

            foreach ($fields as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== null) {
                    $business->$field = $data[$field];
                }
            }

            if ($business->isDirty('location')) {
                $business->google_place_id = null;
                $business->latitude = null;
                $business->longitude = null;
            }

            $business->save();

            \DB::table('audit_logs')->insert([
                'actor_user_id'  => $request->user()->id,
                'action'         => 'entity.admin_edited',
                'auditable_type' => Business::class,
                'auditable_id'   => $business->id,
                'metadata'       => json_encode(['before' => $before, 'after' => $business->only(array_keys($before)), 'reason' => $data['reason'] ?? 'Admin updated organization profile']),
                'ip_address'     => $request->ip(),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Organization updated. Audit log entry recorded.']);
    }

    /**
     * Toggle alert status for a scam case via admin panel.
     * Wraps the ScamCase transition endpoint for quick alert toggles.
     */
    public function toggleCaseAlert(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $data = $request->validate(['alert_enabled' => 'required|boolean']);
        $case = \App\Models\ScamCase::with('business')->findOrFail($id);

        $case->alert_enabled = $data['alert_enabled'];
        if ($data['alert_enabled']) {
            $case->admin_reviewed = true;
            if (!$case->alert_broadcast_started_at) {
                $case->alert_audience_max_user_id = \DB::table('users')->max('id') ?? 0;
                $case->alert_broadcast_started_at = now();
                $case->alert_broadcast_completed_at = now();
            }
            if (in_array($case->status, ['submitted', 'under_review', 'needs_evidence'])) {
                $case->status = 'published';
                $case->published_at = $case->published_at ?: now();
            }

            // Broadcast notification to all active users
            $userIds = \DB::table('users')->pluck('id');
            $notifications = [];
            $now = now();
            $bizName = $case->business->name ?? 'Organization';
            foreach ($userIds as $uid) {
                $notifications[] = [
                    'user_id' => $uid,
                    'type' => 'case_alert',
                    'title' => '🚨 Scam Alert Notice: ' . $bizName,
                    'body' => 'Verified community scam alert for ' . $bizName . ': ' . \Illuminate\Support\Str::limit($case->summary, 120),
                    'url' => '/scam-alerts/' . $case->case_code,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if (!empty($notifications)) {
                foreach (array_chunk($notifications, 500) as $chunk) {
                    \DB::table('notifications')->insert($chunk);
                }
            }
        }
        $case->save();

        \DB::table('audit_logs')->insert([
            'actor_user_id'  => $request->user()->id,
            'action'         => $data['alert_enabled'] ? 'case.alert_enabled' : 'case.alert_disabled',
            'auditable_type' => \App\Models\ScamCase::class,
            'auditable_id'   => $case->id,
            'metadata'       => json_encode(['alert_enabled' => $data['alert_enabled']]),
            'ip_address'     => $request->ip(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Alert status updated.', 'alert_enabled' => $case->alert_enabled]);
    }

    public function broadcastReview(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $review = \App\Models\Review::with('business')->findOrFail($id);
        $review->broadcast_approved_at = now();
        $review->broadcast_approved_by_user_id = $request->user()->id;
        $review->save();

        $userIds = \DB::table('users')->pluck('id');
        $notifications = [];
        $now = now();
        $bizName = $review->business->name ?? 'Organization';
        foreach ($userIds as $uid) {
            $notifications[] = [
                'user_id' => $uid,
                'type' => 'community_broadcast',
                'title' => 'Community Broadcast: ' . $bizName,
                'body' => $review->author . ' shared an experience for ' . $bizName . ': ' . \Illuminate\Support\Str::limit($review->body, 120),
                'url' => '/reviews/' . $review->id,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        if (!empty($notifications)) {
            foreach (array_chunk($notifications, 500) as $chunk) {
                \DB::table('notifications')->insert($chunk);
            }
        }

        \DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()->id,
            'action' => 'review.broadcast_approved',
            'auditable_type' => \App\Models\Review::class,
            'auditable_id' => $review->id,
            'metadata' => json_encode(['review_id' => $review->id]),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Review successfully broadcasted to all citizens!']);
    }

    public function declineReviewBroadcast(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $review = \App\Models\Review::findOrFail($id);
        $review->broadcast_requested = false;
        $review->save();

        return response()->json(['success' => true, 'message' => 'Broadcast request declined. Review remains publicly visible.']);
    }

    /**
     * Get all organizations with administrative filtering and pagination.
     */
    public function allBusinesses(Request $request)
    {
        $this->authorizeAdmin($request);
        $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|string|in:all,approved,pending,rejected',
            'category' => 'nullable|string|max:100',
            'q' => 'nullable|string|max:255'
        ]);

        $query = Business::query();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('q')) {
            $q = trim($request->q);
            $query->where(function ($sub) use ($q) {
                if (is_numeric($q)) {
                    $sub->where('id', (int)$q);
                }
                $sub->orWhere('name', 'like', "%{$q}%")
                    ->orWhere('bengali_name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            });
        }

        $page = $query->orderByDesc('id')->paginate($request->integer('per_page', 25));

        $data = $page->getCollection()->map(function ($b) {
            return [
                'id' => $b->id,
                'slug' => $b->slug,
                'name' => $b->name,
                'bengaliName' => $b->bengali_name,
                'category' => $b->category,
                'description' => $b->description,
                'location' => $b->location,
                'phone' => $b->phone,
                'website' => $b->website,
                'facebookUrl' => $b->facebook_url,
                'image' => $b->image,
                'verified' => (bool)$b->verified,
                'status' => $b->status ?: 'approved',
                'operatingStatus' => $b->operating_status ?: 'open',
                'rating' => (float)$b->rating,
                'reviewCount' => (int)$b->review_count,
                'userId' => $b->user_id,
                'createdAt' => $b->created_at ? $b->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => \Illuminate\Support\Arr::only($page->toArray(), ['current_page', 'per_page', 'total', 'last_page', 'from', 'to']),
        ]);
    }

    /**
     * Permanently delete an organization and safely clean up related foreign keys.
     */
    public function deleteOrganization(Request $request, $id)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Staff access is required.');
        $business = Business::findOrFail($id);
        $name = $business->name;
        $bizId = $business->id;

        \DB::transaction(function () use ($business, $request, $bizId, $name) {
            // Clean advertisements & sponsored campaigns
            \DB::table('advertisements')->where('organization_id', $bizId)->delete();
            if (\Illuminate\Support\Facades\Schema::hasTable('sponsored_campaigns')) {
                \DB::table('sponsored_campaigns')->where('business_id', $bizId)->delete();
            }

            // Unlink any businesses merged into this one
            \DB::table('businesses')->where('merged_into_id', $bizId)->update(['merged_into_id' => null]);

            // Clean direct entity relations
            \DB::table('saved_entities')->where('business_id', $bizId)->delete();
            \DB::table('business_claims')->where('business_id', $bizId)->delete();
            \DB::table('business_profile_images')->where('business_id', $bizId)->delete();
            \DB::table('content_reports')->where('reportable_type', 'business')->where('reportable_id', $bizId)->delete();

            // Clean associated scam cases and their relations
            $scamCaseIds = \DB::table('scam_cases')->where('business_id', $bizId)->pluck('id');
            if ($scamCaseIds->isNotEmpty()) {
                if (\Illuminate\Support\Facades\Schema::hasTable('appeals')) {
                    \DB::table('appeals')->whereIn('scam_case_id', $scamCaseIds)->delete();
                }
                if (\Illuminate\Support\Facades\Schema::hasTable('scam_case_events')) {
                    \DB::table('scam_case_events')->whereIn('scam_case_id', $scamCaseIds)->delete();
                }
                if (\Illuminate\Support\Facades\Schema::hasTable('scam_case_evidence')) {
                    \DB::table('scam_case_evidence')->whereIn('scam_case_id', $scamCaseIds)->delete();
                }
                \DB::table('notifications')->whereIn('scam_case_id', $scamCaseIds)->delete();
                \DB::table('content_reports')->where('reportable_type', 'scam_case')->whereIn('reportable_id', $scamCaseIds)->delete();
                \DB::table('scam_cases')->whereIn('id', $scamCaseIds)->delete();
            }

            // Clean associated reviews
            $reviewIds = \DB::table('reviews')->where('business_id', $bizId)->pluck('id');
            if ($reviewIds->isNotEmpty()) {
                \DB::table('review_comments')->whereIn('review_id', $reviewIds)->delete();
                \DB::table('review_reactions')->whereIn('review_id', $reviewIds)->delete();
                \DB::table('official_responses')->whereIn('review_id', $reviewIds)->delete();
                if (\Illuminate\Support\Facades\Schema::hasTable('review_versions')) {
                    \DB::table('review_versions')->whereIn('review_id', $reviewIds)->delete();
                }
                \DB::table('content_reports')->where('reportable_type', 'review')->whereIn('reportable_id', $reviewIds)->delete();
                \DB::table('reviews')->where('business_id', $bizId)->delete();
            }

            // Reset role of owner if this was their only business
            if ($business->user_id) {
                $otherBizCount = \DB::table('businesses')->where('user_id', $business->user_id)->where('id', '!=', $bizId)->count();
                if ($otherBizCount === 0) {
                    \DB::table('users')->where('id', $business->user_id)->where('role', 'business')->update(['role' => 'user']);
                }
            }

            $business->delete();

            \DB::table('audit_logs')->insert([
                'actor_user_id' => $request->user()->id,
                'action' => 'entity.deleted',
                'auditable_type' => Business::class,
                'auditable_id' => $bizId,
                'metadata' => json_encode(['name' => $name, 'id' => $bizId]),
                'ip_address' => $request->ip(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Organization \"{$name}\" has been permanently deleted."
        ]);
    }
}
