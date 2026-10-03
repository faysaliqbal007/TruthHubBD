<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['reviews', 'scam_cases'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->json('translations')->nullable());
        }
    }

    public function down(): void
    {
        foreach (['reviews', 'scam_cases'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('translations'));
        }
    }
};
