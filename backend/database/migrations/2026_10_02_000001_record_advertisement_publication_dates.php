<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void{Schema::table('advertisements',fn(Blueprint $table)=>$table->timestamp('published_at')->nullable());DB::table('advertisements')->where('status','published')->update(['published_at'=>DB::raw('created_at')]);}
 public function down():void{Schema::table('advertisements',fn(Blueprint $table)=>$table->dropColumn('published_at'));}
};
