<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Admin Boundaries (Divisions, Districts, Upazilas)
        if (!Schema::hasTable('admin_boundaries')) {
            Schema::create('admin_boundaries', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('parent_id')->nullable()->index();
                $table->unsignedTinyInteger('admin_level')->index(); // 1 = Division, 2 = District, 3 = Upazila
                $table->string('admin_type', 32)->index(); // division, district, upazila
                $table->string('name_en', 128)->index();
                $table->string('name_bn', 128)->index();
                $table->string('code', 64)->nullable()->index();
                $table->decimal('min_lat', 10, 7)->nullable();
                $table->decimal('max_lat', 10, 7)->nullable();
                $table->decimal('min_lng', 10, 7)->nullable();
                $table->decimal('max_lng', 10, 7)->nullable();
                $table->geometry('boundary', subtype: 'multipolygon', srid: 4326)->nullable();
                $table->timestamps();
            });
        }

        // 2. Entity Locations
        if (!Schema::hasTable('entity_locations')) {
            Schema::create('entity_locations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('entity_id')->unique();
                $table->string('division_id', 64)->nullable()->index();
                $table->string('district_id', 64)->nullable()->index();
                $table->string('upazila_id', 64)->nullable()->index();
                $table->decimal('latitude', 10, 7)->nullable()->index();
                $table->decimal('longitude', 10, 7)->nullable()->index();
                $table->geometry('location', subtype: 'point', srid: 4326)->nullable();
                $table->string('road', 255)->nullable();
                $table->string('area', 255)->nullable();
                $table->string('postcode', 32)->nullable();
                $table->text('detected_address')->nullable();
                $table->text('confirmed_address')->nullable();
                $table->string('accuracy_level', 32)->default('manual'); // manual, resolved, verified
                $table->boolean('user_confirmed')->default(false);
                $table->timestamps();

                $table->foreign('entity_id')->references('id')->on('businesses')->onDelete('cascade');
            });
        }

        // 3. Geocoder Cache (Rate limiting & local caching for OSM/Nominatim)
        if (!Schema::hasTable('geocoder_cache')) {
            Schema::create('geocoder_cache', function (Blueprint $table) {
                $table->id();
                $table->string('query_hash', 64)->unique();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->string('provider', 32)->default('nominatim');
                $table->json('response_json');
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('geocoder_cache');
        Schema::dropIfExists('entity_locations');
        Schema::dropIfExists('admin_boundaries');
    }
};
