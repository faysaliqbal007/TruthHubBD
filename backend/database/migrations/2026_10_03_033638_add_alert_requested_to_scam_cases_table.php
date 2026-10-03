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
        Schema::table('scam_cases', function (Blueprint $table) {
            $table->boolean('alert_requested')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scam_cases', function (Blueprint $table) {
            $table->dropColumn('alert_requested');
        });
    }
};
