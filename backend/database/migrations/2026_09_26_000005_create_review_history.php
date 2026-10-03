<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create('review_versions',function(Blueprint $t){$t->id();$t->foreignId('review_id')->constrained()->cascadeOnDelete();$t->foreignId('editor_user_id')->constrained('users');$t->json('snapshot');$t->timestamp('created_at');}); }
    public function down(): void {Schema::dropIfExists('review_versions');}
};
