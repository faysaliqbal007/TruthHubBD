<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scam_cases', function (Blueprint $table) {
            // Existing published cases are deliberately not enrolled in alerts.
            $table->timestamp('admin_reviewed_at')->nullable();
            $table->foreignId('admin_reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('alert_enabled')->default(false);
            $table->unsignedBigInteger('alert_audience_max_user_id')->nullable();
            $table->unsignedBigInteger('alert_broadcast_last_user_id')->default(0);
            $table->timestamp('alert_broadcast_started_at')->nullable();
            $table->timestamp('alert_broadcast_completed_at')->nullable();
            $table->index(['alert_enabled', 'admin_reviewed_at', 'published_at'], 'scam_cases_public_alerts_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('scam_case_id')->nullable()->constrained('scam_cases')->cascadeOnDelete();
            // NULL preserves existing notification types. A case alert is once per recipient.
            $table->unique(['user_id', 'scam_case_id', 'type'], 'notifications_case_recipient_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique('notifications_case_recipient_type_unique');
            $table->dropConstrainedForeignId('scam_case_id');
        });
        Schema::table('scam_cases', function (Blueprint $table) {
            $table->dropIndex('scam_cases_public_alerts_index');
            $table->dropConstrainedForeignId('admin_reviewed_by_user_id');
            $table->dropColumn(['admin_reviewed_at', 'alert_enabled', 'alert_audience_max_user_id', 'alert_broadcast_last_user_id', 'alert_broadcast_started_at', 'alert_broadcast_completed_at']);
        });
    }
};
