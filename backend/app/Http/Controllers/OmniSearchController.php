<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OmniSearchController extends Controller
{
    public function search(Request $request)
    {
        $q = trim($request->input('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $type = strtolower(trim($request->input('type', 'all')));
        $results = [];

        // 1. Businesses / Organizations (name, bengali_name, category, location, description, slug, phone)
        if (in_array($type, ['all', 'business', 'businesses', 'organization', 'organizations'])) {
            $businesses = \App\Models\Business::publicDirectory()
                ->where(function ($sub) use ($q) {
                    if (is_numeric($q)) $sub->where('id', $q);
                    $sub->orWhere('name', 'like', "%{$q}%")
                        ->orWhere('bengali_name', 'like', "%{$q}%")
                        ->orWhere('category', 'like', "%{$q}%")
                        ->orWhere('location', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%");
                })
                ->limit($type === 'all' ? 6 : 20)
                ->get();

            foreach ($businesses as $b) {
                $imagePath = $b->image ?: (\App\Models\BusinessProfileImage::where('business_id', $b->id)->whereIn('status', ['approved', 'pending'])->exists() ? '/api/businesses/' . $b->id . '/profile-image' : null);
                $imageUrl = null;
                if ($imagePath) {
                    $imageUrl = str_starts_with($imagePath, 'http') ? $imagePath : (str_starts_with($imagePath, '/') ? url($imagePath) : url('/' . $imagePath));
                }
                $results[] = [
                    'id' => 'biz_' . $b->id,
                    'kind' => 'business',
                    'title' => $b->name,
                    'bengali_title' => $b->bengali_name,
                    'subtitle' => $b->category . ($b->location ? ' · ' . $b->location : ''),
                    'url' => '/business/' . $b->slug,
                    'image' => $imageUrl,
                    'verified' => (bool)$b->verified,
                ];
            }
        }

        // 2. Scam Alerts & Cases (case_code, title, summary, incident_type, business name)
        if (in_array($type, ['all', 'case', 'cases', 'scam', 'scams'])) {
            $cases = \App\Models\ScamCase::publiclyVisible()
                ->with('business:id,name,bengali_name,slug,image')
                ->where(function ($sub) use ($q) {
                    if (is_numeric($q)) $sub->where('scam_cases.id', $q);
                    $sub->orWhere('scam_cases.case_code', 'like', "%{$q}%")
                        ->orWhere('scam_cases.title', 'like', "%{$q}%")
                        ->orWhere('scam_cases.summary', 'like', "%{$q}%")
                        ->orWhere('scam_cases.public_summary', 'like', "%{$q}%")
                        ->orWhere('scam_cases.incident_type', 'like', "%{$q}%")
                        ->orWhereHas('business', fn($b) => $b->where('name', 'like', "%{$q}%")->orWhere('bengali_name', 'like', "%{$q}%"));
                })
                ->limit($type === 'all' ? 6 : 20)
                ->get();

            foreach ($cases as $c) {
                $entityName = $c->business?->name ?: 'Public Alert';
                $statusPart = ($c->status && strtolower($c->status) !== 'published') ? ' · ' . ucfirst($c->status) : '';
                $results[] = [
                    'id' => 'case_' . $c->id,
                    'kind' => 'case',
                    'title' => $c->title,
                    'subtitle' => "Case #{$c->case_code}{$statusPart} · {$entityName}",
                    'url' => '/scam-alerts/' . ($c->slug ?: $c->case_code),
                    'image' => $c->business?->image,
                ];
            }
        }

        // 3. Reviews (title, body, business name, reviewer name)
        if (in_array($type, ['all', 'review', 'reviews'])) {
            $reviews = \App\Models\Review::with(['business:id,name,slug,image', 'user:id,name'])
                ->where('status', 'published')
                ->where(function ($sub) use ($q) {
                    if (is_numeric($q)) $sub->where('reviews.id', $q);
                    $sub->orWhere('reviews.title', 'like', "%{$q}%")
                        ->orWhere('reviews.body', 'like', "%{$q}%")
                        ->orWhereHas('business', fn($b) => $b->where('name', 'like', "%{$q}%")->orWhere('bengali_name', 'like', "%{$q}%"))
                        ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$q}%"));
                })
                ->limit($type === 'all' ? 6 : 20)
                ->get();

            foreach ($reviews as $r) {
                $bizName = $r->business?->name ?: 'Business';
                $preview = mb_substr(strip_tags($r->body ?: ''), 0, 75) . '…';
                $results[] = [
                    'id' => 'rev_' . $r->id,
                    'kind' => 'review',
                    'title' => "Review: {$r->title}",
                    'subtitle' => "{$bizName} · ★ {$r->rating}/5 · {$preview}",
                    'url' => '/reviews/' . $r->id,
                    'image' => $r->business?->image,
                ];
            }
        }

        // 4. Comments (discussion comments on reviews)
        if (in_array($type, ['all', 'comment', 'comments'])) {
            $comments = DB::table('review_comments')
                ->join('reviews', 'reviews.id', '=', 'review_comments.review_id')
                ->join('businesses', 'businesses.id', '=', 'reviews.business_id')
                ->join('users', 'users.id', '=', 'review_comments.user_id')
                ->where('review_comments.status', 'published')
                ->where('reviews.status', 'published')
                ->where(function ($sub) use ($q) {
                    if (is_numeric($q)) $sub->where('review_comments.id', $q);
                    $sub->orWhere('review_comments.body', 'like', "%{$q}%")
                        ->orWhere('users.name', 'like', "%{$q}%")
                        ->orWhere('businesses.name', 'like', "%{$q}%");
                })
                ->select(
                    'review_comments.id',
                    'review_comments.body',
                    'review_comments.review_id',
                    'users.name as author_name',
                    'businesses.name as business_name',
                    'businesses.user_id as business_user_id',
                    'review_comments.user_id'
                )
                ->limit($type === 'all' ? 6 : 20)
                ->get();

            foreach ($comments as $cm) {
                $isOrg = ($cm->business_user_id !== null && (int)$cm->user_id === (int)$cm->business_user_id);
                $displayName = $isOrg ? $cm->business_name : $cm->author_name;
                $preview = mb_substr(strip_tags($cm->body), 0, 80) . '…';
                $results[] = [
                    'id' => 'comment_' . $cm->id,
                    'kind' => 'comment',
                    'title' => "Comment by {$displayName} on {$cm->business_name}",
                    'subtitle' => $preview,
                    'url' => '/reviews/' . $cm->review_id . '#discussion',
                ];
            }
        }

        return response()->json(['success' => true, 'data' => $results]);
    }
}
