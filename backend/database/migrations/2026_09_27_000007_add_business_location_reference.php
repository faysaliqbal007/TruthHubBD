<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void{Schema::table('businesses',function(Blueprint $table){$table->string('presence',16)->nullable();$table->string('google_place_id')->nullable()->index();});}
 public function down():void{Schema::table('businesses',fn(Blueprint $table)=>$table->dropColumn(['presence','google_place_id']));}
};
