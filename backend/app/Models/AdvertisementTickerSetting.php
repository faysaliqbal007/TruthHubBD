<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AdvertisementTickerSetting extends Model {
 protected $table='advertisement_ticker_settings';
 protected $fillable=['enabled','policy_en','policy_bn'];
 protected $casts=['enabled'=>'boolean'];
}
