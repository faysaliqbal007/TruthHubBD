<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {Schema::table('businesses',function(Blueprint $t){$t->string('source_ref')->nullable()->unique();$t->string('source_url')->nullable();$t->timestamp('source_fetched_at')->nullable();$t->decimal('latitude',10,7)->nullable();$t->decimal('longitude',10,7)->nullable();});}
 public function down():void {Schema::table('businesses',fn(Blueprint $t)=>$t->dropColumn(['source_ref','source_url','source_fetched_at','latitude','longitude']));}
};
