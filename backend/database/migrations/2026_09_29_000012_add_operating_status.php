<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {Schema::table('businesses',fn(Blueprint $t)=>$t->string('operating_status',20)->default('unknown'));}
 public function down():void {Schema::table('businesses',fn(Blueprint $t)=>$t->dropColumn('operating_status'));}
};
