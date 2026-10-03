<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scam_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_code')->unique();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('review_id')->nullable()->constrained('reviews')->nullOnDelete();
            $table->foreignId('reporter_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('summary');
            $table->text('public_summary')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->enum('status', ['submitted', 'needs_evidence', 'under_review', 'published', 'disputed', 'resolved', 'not_enough_evidence', 'restricted'])->default('submitted');
            $table->text('decision_rationale')->nullable();
            $table->text('subject_response')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });

        Schema::create('scam_case_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scam_case_id')->constrained('scam_cases')->cascadeOnDelete();
            $table->foreignId('uploaded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('storage_path');
            $table->string('mime_type', 100);
            $table->boolean('is_private')->default(true);
            $table->boolean('is_redacted_for_public')->default(false);
            $table->timestamps();
        });

        Schema::create('business_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('representative_name');
            $table->string('role_title');
            $table->string('contact_phone')->nullable();
            $table->string('evidence_path')->nullable();
            $table->enum('status', ['submitted', 'approved', 'rejected'])->default('submitted');
            $table->text('decision_note')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['business_id', 'user_id']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');
            $table->json('metadata')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();
            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('business_claims');
        Schema::dropIfExists('scam_case_evidence');
        Schema::dropIfExists('scam_cases');
    }
};
