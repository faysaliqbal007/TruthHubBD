<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('review_comments', function (Blueprint $table) {
            $table->id(); $table->foreignId('review_id')->constrained('reviews')->cascadeOnDelete(); $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); $table->foreignId('parent_id')->nullable()->constrained('review_comments')->nullOnDelete();
            $table->text('body'); $table->enum('status', ['published','limited','removed'])->default('published'); $table->timestamps(); $table->index(['review_id','status','created_at']);
        });
        Schema::create('review_reactions', function (Blueprint $table) {
            $table->id(); $table->foreignId('review_id')->constrained('reviews')->cascadeOnDelete(); $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); $table->enum('type', ['helpful','not_helpful']); $table->timestamps(); $table->unique(['review_id','user_id']);
        });
        Schema::create('content_reports', function (Blueprint $table) {
            $table->id(); $table->foreignId('reporter_user_id')->constrained('users')->cascadeOnDelete(); $table->string('reportable_type'); $table->unsignedBigInteger('reportable_id'); $table->string('reason', 100); $table->text('details')->nullable(); $table->enum('status', ['open','resolved','dismissed'])->default('open'); $table->foreignId('handled_by_user_id')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps(); $table->index(['reportable_type','reportable_id']);
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->id(); $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); $table->string('type'); $table->string('title'); $table->text('body'); $table->string('url')->nullable(); $table->timestamp('read_at')->nullable(); $table->timestamps(); $table->index(['user_id','read_at','created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('notifications'); Schema::dropIfExists('content_reports'); Schema::dropIfExists('review_reactions'); Schema::dropIfExists('review_comments'); }
};
