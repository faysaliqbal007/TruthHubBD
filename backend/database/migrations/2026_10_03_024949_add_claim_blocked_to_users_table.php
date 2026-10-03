<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'claim_blocked')) {
                $table->boolean('claim_blocked')->default(false)->after('role');
            }
            if (!Schema::hasColumn('users', 'claim_blocked_reason')) {
                $table->string('claim_blocked_reason', 500)->nullable()->after('claim_blocked');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['claim_blocked', 'claim_blocked_reason']);
        });
    }
};
