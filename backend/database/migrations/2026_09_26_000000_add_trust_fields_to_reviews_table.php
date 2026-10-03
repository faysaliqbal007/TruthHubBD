<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('business_id')->constrained('users')->nullOnDelete();
            $table->date('experience_date')->nullable()->after('date');
            $table->string('relationship_disclosure', 100)->default('none')->after('disclaimer');
            $table->enum('status', ['published', 'under_review', 'limited', 'removed'])->default('published')->after('relationship_disclosure');
            $table->timestamp('edited_at')->nullable()->after('status');
            $table->index(['business_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'status', 'created_at']);
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['experience_date', 'relationship_disclosure', 'status', 'edited_at']);
        });
    }
};
