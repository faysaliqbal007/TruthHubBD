<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessProfileImage extends Model
{
    protected $fillable = ['business_id', 'uploaded_by_user_id', 'storage_path', 'mime_type', 'bytes', 'sha256', 'publication_consent', 'status', 'reviewed_by_user_id', 'moderation_note', 'reviewed_at'];
    protected $hidden = ['storage_path', 'sha256'];
    protected $casts = ['publication_consent' => 'boolean', 'reviewed_at' => 'datetime'];

    public function business() { return $this->belongsTo(Business::class); }
}
