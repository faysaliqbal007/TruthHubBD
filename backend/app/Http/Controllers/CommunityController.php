<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function show(Request $request, Review $review) {
        abort_unless($review->status === 'published', 404);
        $comments = \DB::table('review_comments')->join('users', 'users.id', '=', 'review_comments.user_id')
            ->where('review_id', $review->id)->where('status', 'published')
            ->select('review_comments.id', 'review_comments.user_id', 'body', 'parent_id', 'review_comments.created_at', 'users.name as author', 'users.email as author_identity', 'users.avatar_url as author_avatar')
            ->orderBy('review_comments.id')->get()->map(function ($comment) use ($review) {
                $translations = $review->is_demo && $comment->author_identity === 'preview@example.test'
                    ? \App\Support\DemoDiscussion::translations($comment->body) : [];
                $isOwnerOfThisOrg = ($review->business->user_id !== null && (int)$comment->user_id === (int)$review->business->user_id);
                $authorName = $isOwnerOfThisOrg ? $review->business->name : $comment->author;
                $baseUrl = rtrim(config('app.url', 'http://localhost:8001'), '/');
                $avatar = null;
                if ($isOwnerOfThisOrg) {
                    $bizImg = $review->business->image ?: (\App\Models\BusinessProfileImage::where('business_id', $review->business->id)->whereIn('status', ['approved', 'pending'])->exists() ? '/api/businesses/' . $review->business->id . '/profile-image' : null);
                    if ($bizImg) {
                        $avatar = str_starts_with($bizImg, 'http') ? $bizImg : ($baseUrl . (str_starts_with($bizImg, '/') ? '' : '/') . $bizImg);
                    }
                } elseif (!empty($comment->author_avatar)) {
                    $avatar = str_starts_with($comment->author_avatar, 'http') ? $comment->author_avatar : ($baseUrl . (str_starts_with($comment->author_avatar, '/') ? '' : '/') . $comment->author_avatar);
                }
                return [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'parent_id' => $comment->parent_id,
                    'created_at' => $comment->created_at,
                    'author' => $authorName,
                    'avatar_url' => $avatar,
                    'is_organization' => $isOwnerOfThisOrg,
                    'badge' => $isOwnerOfThisOrg ? 'Official Organization' : null,
                    'translations' => (object) $translations,
                ];
            });
        $public = \App\Support\PublicReview::serialize($review, true);
        $canEdit = $review->user_id !== null && $request->user('sanctum')?->id === $review->user_id && ($request->user('sanctum')?->role === 'admin' || $review->created_at->diffInMinutes(now()) <= 180);
        $bizData = $review->business->only(['id', 'name', 'slug', 'image', 'category']);
        if (empty($bizData['image'])) {
            $hasImg = \App\Models\BusinessProfileImage::where('business_id', $review->business->id)->whereIn('status', ['approved', 'pending'])->exists();
            if ($hasImg) {
                $bizData['image'] = '/api/businesses/' . $review->business->id . '/profile-image';
            }
        }
        return response()->json(['success' => true, 'data' => $public + ['helpful_count' => $public['helpfulCount'], 'not_helpful_count' => $public['notHelpfulCount'], 'viewer_reaction' => $public['viewerReaction'], 'edited_at' => $review->edited_at, 'can_edit' => $canEdit, 'edit_time_remaining_minutes' => max(0, 180 - $review->created_at->diffInMinutes(now())), 'official_response' => \DB::table('official_responses')->where('review_id', $review->id)->select('body', 'updated_at')->first(), 'business' => $bizData, 'comments' => $comments]]);
    }
    public function comment(Request $request, Review $review) {
        abort_unless($review->status === 'published', 404);
        $data = $request->validate(['body' => 'required|string|max:3000', 'parent_id' => 'nullable|exists:review_comments,id']);
        if (!empty($data['parent_id'])) abort_unless(\DB::table('review_comments')->where('id', $data['parent_id'])->where('review_id', $review->id)->where('status', 'published')->exists(), 422, 'Reply must belong to this review.');
        $comment = \DB::table('review_comments')->insertGetId(['review_id' => $review->id, 'user_id' => $request->user()->id, 'parent_id' => $data['parent_id'] ?? null, 'body' => $data['body'], 'status' => 'published', 'created_at' => now(), 'updated_at' => now()]);
        
        $isOwnerOfThisOrg = ($review->business->user_id !== null && (int)$request->user()->id === (int)$review->business->user_id);
        $authorName = $isOwnerOfThisOrg ? $review->business->name : $request->user()->name;

        if ($review->user_id && $review->user_id !== $request->user()->id) {
            \DB::table('notifications')->insert([
                'user_id' => $review->user_id,
                'type' => 'review_comment',
                'title' => $isOwnerOfThisOrg ? 'Official reply from ' . $review->business->name : 'New comment on your review',
                'body' => $isOwnerOfThisOrg ? $review->business->name . ' replied to your review.' : 'Someone joined the conversation on your review.',
                'url' => '/reviews/' . $review->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
        $created = \DB::table('review_comments')->find($comment);
        return response()->json([
            'success' => true,
            'data' => array_merge((array) $created, [
                'author' => $authorName,
                'is_organization' => $isOwnerOfThisOrg,
                'badge' => $isOwnerOfThisOrg ? 'Official Organization' : null
            ])
        ], 201);
    }
    public function react(Request $request, Review $review) {
        $data = $request->validate(['type' => 'required|in:helpful,not_helpful']);
        $result = \DB::transaction(function () use ($review, $request, $data) {
            // Serialize all writers for this review, including different voters. The
            // count and reaction must commit together; recounting would discard legacy totals.
            $locked = Review::whereKey($review->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'published', 404);
            abort_if($locked->user_id === $request->user()->id, 422, 'You cannot vote on your own review.');
            $reactions = \DB::table('review_reactions')->where('review_id', $locked->id)->where('user_id', $request->user()->id);
            $previous = (clone $reactions)->first();
            $next = $previous?->type === $data['type'] ? null : $data['type'];
            if ($next === null) {
                $reactions->delete();
            } elseif ($previous) {
                $reactions->update(['type' => $next, 'updated_at' => now()]);
            } else {
                \DB::table('review_reactions')->insert(['review_id' => $locked->id, 'user_id' => $request->user()->id, 'type' => $next, 'created_at' => now(), 'updated_at' => now()]);
            }
            $delta = (int) ($next === 'helpful') - (int) ($previous?->type === 'helpful');
            $locked->update(['helpful_count' => max(0, $locked->helpful_count + $delta)]);
            return ['helpful_count' => (int) $locked->helpful_count,
                'not_helpful_count' => \DB::table('review_reactions')->where('review_id', $locked->id)->where('type', 'not_helpful')->count(),
                'viewer_reaction' => $next];
        }, 3);
        return response()->json(['success' => true] + $result);
    }
    public function report(Request $request) {
        $data = $request->validate(['reportable_type' => 'required|in:review,comment,scam_case,business,advertisement', 'reportable_id' => 'required|integer|min:1', 'reason' => 'required|string|max:100', 'details' => 'nullable|string|max:3000']);
        // Public reporting must not confirm the existence of private or withdrawn content.
        $visible = match ($data['reportable_type']) {
            'business' => \App\Models\Business::publicDirectory()->whereKey($data['reportable_id'])->exists(),
            'review' => Review::whereKey($data['reportable_id'])->where('status', 'published')->exists(),
            'scam_case' => \App\Models\ScamCase::publiclyVisible()->whereKey($data['reportable_id'])->exists(),
            'advertisement' => \App\Models\Advertisement::publiclyVisible()->whereKey($data['reportable_id'])->exists(),
            'comment' => \DB::table('review_comments')->join('reviews', 'reviews.id', '=', 'review_comments.review_id')
                ->where('review_comments.id', $data['reportable_id'])->where('review_comments.status', 'published')
                ->where('reviews.status', 'published')->exists(),
        };
        abort_unless($visible, 404);
        $id = \DB::table('content_reports')->insertGetId($data + ['reporter_user_id' => $request->user()->id, 'status' => 'open', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => true, 'data' => \DB::table('content_reports')->find($id)], 201);
    }
    public function notifications(Request $request) { return response()->json(['success' => true, 'data' => \DB::table('notifications')->where('user_id', $request->user()->id)->latest()->orderByDesc('id')->limit(30)->get()]); }
    public function markRead(Request $request, int $id) { \DB::table('notifications')->where('id', $id)->where('user_id', $request->user()->id)->update(['read_at' => now(), 'updated_at' => now()]); return response()->noContent(); }

    public function image(Review $review)
    {
        $rawPath = $review->image_path;
        if (!$rawPath && !empty($review->evidence_paths)) {
            $rawPath = $review->evidence_paths[0]['path'] ?? null;
        }
        if (!$rawPath) abort(404);
        if (str_starts_with($rawPath, 'private:')) {
            $rawPath = substr($rawPath, 8);
        }
        $fullPath = \Illuminate\Support\Facades\Storage::disk('private')->path($rawPath);
        if (!is_file($fullPath)) abort(404);

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($fullPath) ?: 'image/jpeg';
        return response(file_get_contents($fullPath), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    public function attachment(Review $review, int $index)
    {
        $evidence = $review->evidence_paths ?? [];
        if (!isset($evidence[$index]['path'])) abort(404);
        $rawPath = $evidence[$index]['path'];
        if (str_starts_with($rawPath, 'private:')) {
            $rawPath = substr($rawPath, 8);
        }
        $fullPath = \Illuminate\Support\Facades\Storage::disk('private')->path($rawPath);
        if (!is_file($fullPath)) abort(404);

        $mime = $evidence[$index]['mime'] ?? ((new \finfo(FILEINFO_MIME_TYPE))->file($fullPath) ?: 'image/jpeg');
        return response(file_get_contents($fullPath), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
