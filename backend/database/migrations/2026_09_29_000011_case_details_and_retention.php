<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::table('scam_cases',function(Blueprint $t){$t->string('incident_type',60)->nullable();$t->date('incident_date')->nullable();$t->text('reporter_update')->nullable();$t->text('resolution_note')->nullable();$t->boolean('legal_hold')->default(false);});
  Schema::table('business_claims',fn(Blueprint $t)=>$t->boolean('legal_hold')->default(false));
 }
 public function down():void {Schema::table('scam_cases',fn(Blueprint $t)=>$t->dropColumn(['incident_type','incident_date','reporter_update','resolution_note','legal_hold']));Schema::table('business_claims',fn(Blueprint $t)=>$t->dropColumn('legal_hold'));}
};
