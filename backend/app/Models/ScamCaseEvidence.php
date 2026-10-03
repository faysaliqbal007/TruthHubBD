<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScamCaseEvidence extends Model
{
    protected $table = 'scam_case_evidence';
    protected $hidden = ['storage_path'];
    protected $fillable = ['scam_case_id', 'uploaded_by_user_id', 'label', 'storage_path', 'mime_type', 'is_private', 'is_redacted_for_public'];
    protected $casts = ['is_private' => 'boolean', 'is_redacted_for_public' => 'boolean'];
}
