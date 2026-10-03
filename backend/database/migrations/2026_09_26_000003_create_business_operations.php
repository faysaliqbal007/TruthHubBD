<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('official_responses', function (Blueprint $t) {
            $t->id(); $t->foreignId('review_id')->unique()->constrained()->cascadeOnDelete(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->text('body'); $t->timestamps();
        });
        Schema::create('sponsored_campaigns', function (Blueprint $t) {
            $t->id(); $t->foreignId('business_id')->constrained()->cascadeOnDelete(); $t->string('placement'); $t->string('category'); $t->string('location')->nullable(); $t->date('starts_at'); $t->date('ends_at'); $t->boolean('active')->default(false); $t->unsignedBigInteger('impressions')->default(0); $t->unsignedBigInteger('clicks')->default(0); $t->timestamps();
        });
        Schema::create('appeals', function (Blueprint $t) {
            $t->id(); $t->foreignId('scam_case_id')->constrained()->cascadeOnDelete(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->text('reason'); $t->string('status')->default('submitted'); $t->text('decision_note')->nullable(); $t->timestamps();
        });
        Schema::create('saved_entities', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->foreignId('business_id')->constrained()->cascadeOnDelete(); $t->unique(['user_id','business_id']);
        });
    }
    public function down(): void { foreach (['saved_entities','appeals','sponsored_campaigns','official_responses'] as $table) Schema::dropIfExists($table); }
};
