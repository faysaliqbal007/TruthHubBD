<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeocoderCache extends Model
{
    use HasFactory;

    protected $table = 'geocoder_cache';

    protected $fillable = [
        'query_hash',
        'latitude',
        'longitude',
        'provider',
        'response_json',
        'expires_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'response_json' => 'array',
        'expires_at' => 'datetime',
    ];
}
