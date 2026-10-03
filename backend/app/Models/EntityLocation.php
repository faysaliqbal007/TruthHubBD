<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntityLocation extends Model
{
    use HasFactory;

    protected $table = 'entity_locations';

    protected $fillable = [
        'entity_id',
        'division_id',
        'district_id',
        'upazila_id',
        'latitude',
        'longitude',
        'location',
        'road',
        'area',
        'postcode',
        'detected_address',
        'confirmed_address',
        'accuracy_level',
        'user_confirmed',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'user_confirmed' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class, 'entity_id');
    }
}
