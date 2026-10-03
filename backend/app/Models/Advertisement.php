<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    public const SECTORS = ['education','healthcare','recruitment','general'];
    public const STATUSES = ['draft','published','paused','archived'];
    protected $fillable = ['sample_key','title_en','title_bn','body_en','body_bn','bullets_en','bullets_bn','sector','organization_id','destination_url','image_source','illustration_theme','creative_image_path','show_in_ticker','ticker_text_en','ticker_text_bn','starts_at','ends_at','display_order','is_sample','status','decision_rationale','created_by_user_id','updated_by_user_id'];
    protected $hidden = ['sample_key'];
    public const CREATIVE_IMAGES = ['/advertisement-media/reference-education.jpg','/advertisement-media/reference-healthcare.jpg','/advertisement-media/reference-recruitment.jpg'];
    protected $casts = ['bullets_en'=>'array','bullets_bn'=>'array','is_sample'=>'boolean','show_in_ticker'=>'boolean','starts_at'=>'datetime','ends_at'=>'datetime','published_at'=>'datetime','display_order'=>'integer'];

    public function organization() { return $this->belongsTo(Business::class,'organization_id'); }
    protected static function booted():void {static::creating(function(Advertisement $ad){if($ad->status==='published'&&!$ad->published_at)$ad->published_at=now();});}

    public function scopePubliclyVisible($query)
    {
        $time = now();
        return $query->where('status','published')
            ->where(fn ($schedule) => $schedule->whereNull('starts_at')->orWhere('starts_at','<=',$time))
            ->where(fn ($schedule) => $schedule->whereNull('ends_at')->orWhere('ends_at','>',$time))
            ->where(fn ($association) => $association->whereNull('organization_id')->orWhereHas('organization',fn ($organization) => $organization->where('status','approved')->whereNull('merged_into_id')));
    }
}
