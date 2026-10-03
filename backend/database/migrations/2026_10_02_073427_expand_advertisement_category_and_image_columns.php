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
        Schema::table('advertisements', function (Blueprint $table) {
            $table->string('sector', 100)->default('general')->change();
            $table->string('creative_image_path', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('advertisements', function (Blueprint $table) {
            $table->string('sector', 20)->default('general')->change();
            $table->string('creative_image_path', 255)->nullable()->change();
        });
    }
};
