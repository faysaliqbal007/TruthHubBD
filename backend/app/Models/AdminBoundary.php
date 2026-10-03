<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminBoundary extends Model
{
    use HasFactory;

    protected $table = 'admin_boundaries';

    protected $fillable = [
        'parent_id',
        'admin_level',
        'admin_type',
        'name_en',
        'name_bn',
        'code',
        'min_lat',
        'max_lat',
        'min_lng',
        'max_lng',
        'boundary',
    ];

    public function parent()
    {
        return $this->belongsTo(AdminBoundary::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AdminBoundary::class, 'parent_id');
    }
}
