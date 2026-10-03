<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void{Schema::create('scam_case_events',function(Blueprint $t){$t->id();$t->foreignId('scam_case_id')->constrained()->cascadeOnDelete();$t->string('status');$t->text('summary')->nullable();$t->boolean('is_public')->default(false);$t->timestamp('created_at');});}
 public function down():void{Schema::dropIfExists('scam_case_events');}
};
