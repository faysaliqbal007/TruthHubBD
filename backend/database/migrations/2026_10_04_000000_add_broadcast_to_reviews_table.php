<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('reviews', 'broadcast_requested')) {
                $table->boolean('broadcast_requested')->default(false)->after('status');
            }
            if (!Schema::hasColumn('reviews', 'broadcast_approved_at')) {
                $table->timestamp('broadcast_approved_at')->nullable()->after('broadcast_requested');
            }
            if (!Schema::hasColumn('reviews', 'broadcast_approved_by_user_id')) {
                $table->unsignedBigInteger('broadcast_approved_by_user_id')->nullable()->after('broadcast_approved_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            if (Schema::hasColumn('reviews', 'broadcast_approved_by_user_id')) {
                $table->dropColumn('broadcast_approved_by_user_id');
            }
            if (Schema::hasColumn('reviews', 'broadcast_approved_at')) {
                $table->dropColumn('broadcast_approved_at');
            }
            if (Schema::hasColumn('reviews', 'broadcast_requested')) {
                $table->dropColumn('broadcast_requested');
            }
        });
    }
};
