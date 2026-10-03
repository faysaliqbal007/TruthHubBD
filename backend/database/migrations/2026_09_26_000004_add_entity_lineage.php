<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('businesses',function(Blueprint $t){$t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();$t->foreignId('merged_into_id')->nullable()->constrained('businesses')->nullOnDelete();}); }
    public function down(): void { Schema::table('businesses',function(Blueprint $t){$t->dropConstrainedForeignId('created_by_user_id');$t->dropConstrainedForeignId('merged_into_id');}); }
};
