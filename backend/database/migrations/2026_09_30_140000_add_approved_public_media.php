<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', fn (Blueprint $table) => $table->boolean('is_demo')->default(false));
        foreach (['reviews', 'scam_cases'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->boolean('is_demo')->default(false);
                // Approved, consented/redacted public copies only. Original evidence stays private.
                $table->json('public_media')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('businesses', fn (Blueprint $table) => $table->dropColumn('is_demo'));
        foreach (['reviews', 'scam_cases'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['is_demo', 'public_media']));
        }
    }
};
