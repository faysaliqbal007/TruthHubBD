<?php

namespace App\Support;

use App\Models\Review;

final class PublicReview
{
    public static function serialize(Review $review, bool $withBusiness = false): array
    {
        $user = request()->user('sanctum');
        $case = $review->scamCase()->publiclyVisible()->first();
        $videos = $review->public_video_consent ? PublicVideoLinks::visible($review->public_video_urls) : [];
        if ($review->scamCase()->exists()) $videos = $case ? array_values(array_intersect($videos, PublicVideoLinks::visible($case->public_video_urls))) : [];
        $viewerId = $user?->id;
        $reactions = \DB::table('review_reactions')->where('review_id', $review->id);
        $isPrivate = str_starts_with($review->image_path ?? '', 'private:') || !empty($review->evidence_paths);
        $baseUrl = rtrim(config('app.url', 'http://localhost:8001'), '/');
        $imageUrl = (!$isPrivate && !empty($review->image_path)) ? ($baseUrl . '/api/reviews/'.$review->id.'/image') : null;
        $attachmentUrls = [];
        if (!$isPrivate && !empty($review->evidence_paths) && is_array($review->evidence_paths)) {
            foreach (array_keys($review->evidence_paths) as $idx) {
                $attachmentUrls[] = $baseUrl . '/api/reviews/'.$review->id.'/attachments/'.$idx;
            }
        } elseif ($imageUrl) {
            $attachmentUrls[] = $imageUrl;
        }

        $authorAvatar = null;
        if ($review->user?->avatar_url) {
            $avatar = $review->user->avatar_url;
            $authorAvatar = str_starts_with($avatar, 'http') ? $avatar : ($baseUrl . (str_starts_with($avatar, '/') ? '' : '/') . $avatar);
        }

        $public = [
            'id' => $review->id, 'author' => $review->author,
            'authorAvatar' => $authorAvatar,
            'initials' => $review->initials ?: mb_strtoupper(mb_substr($review->author, 0, 2)),
            'rating' => (int) $review->rating, 'title' => $review->title, 'body' => $review->body,
            'date' => $review->date ?: $review->created_at?->format('Y-m-d'),
            'experienceDate' => $review->experience_date?->format('Y-m-d'),
            'disclaimer' => $review->disclaimer, 'relationshipDisclosure' => $review->relationship_disclosure,
            'status' => $review->status, 'verifiedExperience' => (bool) $review->verified_experience,
            'location' => $review->location, 'facebookUrl' => $review->facebook_url,
            'imagePath' => $imageUrl, 'images' => $attachmentUrls,
            'serviceRating' => $review->service_rating, 'valueRating' => $review->value_rating,
            'commRating' => $review->comm_rating, 'helpfulCount' => (int) $review->helpful_count,
            'notHelpfulCount' => (clone $reactions)->where('type', 'not_helpful')->count(),
            'viewerReaction' => $viewerId ? (clone $reactions)->where('user_id', $viewerId)->value('type') : null,
            'canReact' => $viewerId !== null && $viewerId !== $review->user_id,
            'discussionCount' => $review->publicDiscussionCount(), 'public_media' => $review->public_media,
            'is_demo' => (bool) $review->is_demo, 'translations' => (object) $review->translations,
            'public_video_urls' => $videos,
            'video_accessibility' => 'not_verified',
            'linked_case' => $case ? [
                'id' => $case->id,
                'case_code' => $case->case_code,
                'status' => $case->status,
                'alert_enabled' => (bool)$case->alert_enabled,
                'admin_reviewed' => (bool)$case->admin_reviewed,
                'url' => '/scam-alerts/'.$case->case_code
            ] : null,
        ];
        if ($withBusiness) {
            $businessImage = $review->business?->image;
            if (!$businessImage && $review->business_id) {
                $hasProfileImg = \App\Models\BusinessProfileImage::where('business_id', $review->business_id)
                    ->whereIn('status', ['approved', 'pending'])
                    ->exists();
                if ($hasProfileImg) {
                    $businessImage = '/api/businesses/' . $review->business_id . '/profile-image';
                }
            }
            $public += ['businessName' => $review->business?->name ?? 'Business Entity',
                'businessSlug' => $review->business?->slug ?? '', 'businessCategory' => $review->business?->category ?? '',
                'businessLocation' => $review->business?->location,
                'businessImage' => $businessImage];
        }
        return $public;
    }
}
