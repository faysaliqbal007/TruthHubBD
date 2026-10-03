<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Review Model
 * Stores community reviews for a business entity.
 * Supports Issue #3 (optional location), Issue #4 (optional facebook_url), and Issue #5 (optional image_path).
 */
class Review extends Model
{
    use HasFactory;
    protected $hidden = ['public_video_urls', 'public_video_consent', 'evidence_paths', 'image_path'];

    protected $fillable = [
        'is_demo',
        'public_media',
        'public_video_urls',
        'public_video_consent',
        'translations',
        'business_id',
        'user_id',
        'author',
        'initials',
        'rating',
        'title',
        'body',
        'date',
        'experience_date',
        'disclaimer',
        'relationship_disclosure',
        'status',
        'edited_at',
        'verified_experience',
        'location',      // Issue #3: Optional location
        'facebook_url',  // Issue #4: Optional Facebook page URL
        'image_path',    // Issue #5: Uploaded receipt/photo file path
        'evidence_paths',
        'helpful_count',
        'discussion_count',
        'service_rating',
        'value_rating',
        'comm_rating',
    ];

    protected $casts = [
        'is_demo' => 'boolean',
        'public_media' => 'array',
        'public_video_urls' => 'array',
        'public_video_consent' => 'boolean',
        'translations' => 'array',
        'evidence_paths' => 'array',
        'verified_experience' => 'boolean',
        'rating' => 'integer',
        'helpful_count' => 'integer',
        'discussion_count' => 'integer',
        'experience_date' => 'date',
        'edited_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($review) {
            if (empty($review->author)) {
                $review->author = $review->user?->name ?? 'Community Member';
            }
            if (empty($review->initials) && !empty($review->author)) {
                $parts = preg_split('/\s+/', trim($review->author));
                $review->initials = strtoupper(mb_substr($parts[0] ?? '', 0, 1) . (isset($parts[1]) ? mb_substr($parts[1], 0, 1) : ''));
            }
        });
    }

    /**
     * Relationship: A review belongs to a business entity.
     */
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scamCase()
    {
        return $this->hasOne(ScamCase::class);
    }

    public function getPublicMediaAttribute($value): array
    {
        return \App\Support\PublicMedia::visible($value, (bool) $this->is_demo);
    }

    public function getTranslationsAttribute($value): array
    {
        return \App\Support\PublicTranslations::visible($value, ['title', 'body']);
    }

    public function scopeWithPublicDiscussionCount($query)
    {
        return $query->addSelect('reviews.*')->selectSub(\DB::table('review_comments')->selectRaw('COUNT(*)')
            ->whereColumn('review_comments.review_id', 'reviews.id')->where('review_comments.status', 'published'), 'published_discussion_count');
    }

    public function publicDiscussionCount(): int
    {
        if (array_key_exists('published_discussion_count', $this->attributes)) return (int) $this->attributes['published_discussion_count'];
        return \DB::table('review_comments')->where('review_id', $this->id)->where('status', 'published')->count();
    }
}

