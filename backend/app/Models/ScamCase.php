<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScamCase extends Model
{
    use HasFactory;
    protected $hidden = ['incoming_video_urls', 'public_video_consent', 'public_video_urls', 'legacy_review_id', 'alert_audience_max_user_id', 'alert_broadcast_last_user_id'];
    protected $appends = ['admin_reviewed'];
    protected $fillable = ['alert_requested','admin_reviewed_at','admin_reviewed_by_user_id','alert_enabled','alert_audience_max_user_id','alert_broadcast_last_user_id','alert_broadcast_started_at','alert_broadcast_completed_at','incoming_video_urls','public_video_urls','public_video_consent','translations','is_demo','public_media','incident_type','incident_date','reporter_update','resolution_note','case_code', 'business_id', 'review_id', 'reporter_user_id', 'reviewed_by_user_id', 'title', 'summary', 'public_summary', 'amount', 'status', 'decision_rationale', 'subject_response', 'published_at', 'resolved_at'];
    protected $casts = ['alert_requested'=>'boolean','admin_reviewed_at'=>'datetime','alert_enabled'=>'boolean','alert_broadcast_started_at'=>'datetime','alert_broadcast_completed_at'=>'datetime','incoming_video_urls'=>'array','public_video_urls'=>'array','public_video_consent'=>'boolean','translations' => 'array', 'is_demo' => 'boolean', 'public_media' => 'array', 'amount' => 'decimal:2', 'published_at' => 'datetime', 'resolved_at' => 'datetime'];
    public function business() { return $this->belongsTo(Business::class); }
    public function reporter() { return $this->belongsTo(User::class, 'reporter_user_id'); }
    public function evidence() { return $this->hasMany(ScamCaseEvidence::class); }
    public function review() { return $this->belongsTo(Review::class); }

    public function getPublicMediaAttribute($value): array
    {
        return \App\Support\PublicMedia::visible($value, (bool) $this->is_demo);
    }

    public function scopePubliclyVisible($query)
    {
        return $query->where(function ($q) {
            $q->where(function ($sub) {
                $sub->whereNotNull('scam_cases.published_at')
                    ->whereIn('scam_cases.status', ['published', 'under_review', 'disputed', 'resolved']);
            })->orWhere('scam_cases.alert_requested', true);
        })->where('scam_cases.status', '!=', 'restricted');
    }

    public function scopeTrending($query)
    {
        return $query->whereNotNull('scam_cases.admin_reviewed_at')->where('scam_cases.alert_enabled', true);
    }

    public function getAdminReviewedAttribute(): bool
    {
        return $this->admin_reviewed_at !== null;
    }

    public function setAdminReviewedAttribute($value): void
    {
        if ($value) {
            $this->attributes['admin_reviewed_at'] = $this->admin_reviewed_at ?: now();
        } else {
            $this->attributes['admin_reviewed_at'] = null;
            $this->attributes['admin_reviewed_by_user_id'] = null;
        }
    }

    public function getTranslationsAttribute($value): array
    {
        return \App\Support\PublicTranslations::visible($value, ['title', 'summary']);
    }
}
