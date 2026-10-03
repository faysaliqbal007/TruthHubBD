<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->string('sample_key')->nullable()->unique();
            $table->string('title_en',140); $table->string('title_bn',140);
            $table->text('body_en'); $table->text('body_bn');
            $table->json('bullets_en')->nullable(); $table->json('bullets_bn')->nullable();
            $table->string('sector',20)->default('general');
            $table->foreignId('organization_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->text('destination_url')->nullable();
            $table->string('image_source',30)->default('illustration');
            $table->string('illustration_theme',20)->default('general');
            $table->timestamp('starts_at')->nullable(); $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_sample')->default(false);
            $table->string('status',20)->default('draft');
            $table->text('decision_rationale');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status','starts_at','ends_at'],'advertisements_public_schedule_index');
        });
    }

    public function down(): void { Schema::dropIfExists('advertisements'); }
};
