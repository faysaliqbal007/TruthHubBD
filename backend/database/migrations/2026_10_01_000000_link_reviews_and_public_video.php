<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->json('public_video_urls')->nullable();
            $table->boolean('public_video_consent')->default(false);
        });
        Schema::table('scam_cases', function (Blueprint $table) {
            $table->json('incoming_video_urls')->nullable();
            $table->boolean('public_video_consent')->default(false);
            $table->json('public_video_urls')->nullable();
            $table->unsignedBigInteger('legacy_review_id')->nullable();
        });
        // Preserve every old case and approval. Retain one active link, preferring an
        // already public case; archive duplicate links before enforcing uniqueness.
        $duplicates = DB::table('scam_cases')->whereNotNull('review_id')->select('review_id')
            ->groupBy('review_id')->havingRaw('COUNT(*) > 1')->pluck('review_id');
        foreach ($duplicates as $reviewId) {
            $cases = DB::table('scam_cases')->where('review_id', $reviewId)
                ->orderByRaw("CASE WHEN published_at IS NOT NULL AND status IN ('published','under_review','disputed','resolved') THEN 0 ELSE 1 END")
                ->orderBy('id')->pluck('id');
            DB::table('scam_cases')->whereIn('id', $cases->slice(1))->update(['legacy_review_id' => $reviewId, 'review_id' => null]);
        }
        Schema::table('scam_cases', fn (Blueprint $table) => $table->unique('review_id', 'scam_cases_review_id_unique'));
    }

    public function down(): void
    {
        Schema::table('scam_cases', fn (Blueprint $table) => $table->dropUnique('scam_cases_review_id_unique'));
        DB::table('scam_cases')->whereNotNull('legacy_review_id')->whereExists(fn ($query) => $query->selectRaw('1')->from('reviews')->whereColumn('reviews.id','scam_cases.legacy_review_id'))->update(['review_id' => DB::raw('legacy_review_id')]);
        Schema::table('scam_cases', fn (Blueprint $table) => $table->dropColumn(['incoming_video_urls', 'public_video_consent', 'public_video_urls', 'legacy_review_id']));
        Schema::table('reviews', fn (Blueprint $table) => $table->dropColumn(['public_video_urls', 'public_video_consent']));
    }
};
