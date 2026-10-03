<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void{Schema::table('users',function(Blueprint $t){$t->text('two_factor_secret')->nullable();$t->timestamp('two_factor_confirmed_at')->nullable();$t->bigInteger('two_factor_last_step')->nullable();$t->text('two_factor_recovery_hashes')->nullable();});}
 public function down():void{Schema::table('users',fn(Blueprint $t)=>$t->dropColumn(['two_factor_secret','two_factor_confirmed_at','two_factor_last_step','two_factor_recovery_hashes']));}
};
