<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessClaim extends Model
{
    protected $hidden = ['evidence_path','business_photo_path'];
    protected $fillable = ['business_id', 'user_id', 'representative_name', 'role_title', 'contact_phone', 'contact_email','business_address','document_type','business_photo_path','evidence_path', 'status', 'decision_note', 'reviewed_by_user_id'];
    public function business() { return $this->belongsTo(Business::class); }
    public function user() { return $this->belongsTo(User::class); }
}
