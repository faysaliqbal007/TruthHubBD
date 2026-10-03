<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Support\PublicMedia;
use Database\Seeders\SampleCommunityContentSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RefreshSampleCommunityMedia extends Command
{
    protected $signature = 'sample:community-media {--apply : Replace one reserved sample illustration on eligible existing local demo galleries}';
    protected $description = 'Preview an AI illustration refresh for existing fictional shop samples; never creates records or changes text/approvals';

    public function handle(): int
    {
        if (!app()->environment(['local','testing'])) {
            $this->error('Sample media is restricted to local/testing environments. Nothing written.');
            return self::FAILURE;
        }
        $counts = ['reviews'=>0,'scam_cases'=>0];
        DB::transaction(function () use (&$counts): void {
            foreach ([Review::class=>'reviews',ScamCase::class=>'scam_cases'] as $model=>$table) {
                $records = $model::where('is_demo',true)->whereHas('business', fn ($query) => $query->where('is_demo',true)
                    ->whereIn('slug',['sample-community-v1-dhaka','sample-community-v1-sylhet']))->orderBy('id')->lockForUpdate()->get();
                foreach ($records as $record) {
                    $business = Business::whereKey($record->business_id)->lockForUpdate()->first();
                    if (!$business || !$business->is_demo || $business->verified || $business->user_id !== null || $business->source_ref !== null || $business->source_url !== null) continue;
                    $marker = $table === 'reviews' ? $record->disclaimer : $record->case_code;
                    $pattern = $table === 'reviews' ? '/\ASAMPLE-COMMUNITY-V1-(\d{3}): fictional preview, not a real experience\.\z/' : '/\ASAMPLE-V1-(\d{3})\z/';
                    if (!preg_match($pattern,$marker ?? '',$match)) continue;
                    $number = (int)$match[1];
                    $limit = $table === 'reviews' ? SampleCommunityContentSeeder::REVIEW_COUNT : SampleCommunityContentSeeder::CASE_COUNT;
                    // Preserve the original no-image, one-image, and multiple-image variants.
                    if ($number < 1 || $number > $limit || ($number-1)%3 === 0) continue;
                    $expectedSlug = ($number-1)%SampleCommunityContentSeeder::ORGANIZATION_COUNT === 0 ? 'sample-community-v1-dhaka' : 'sample-community-v1-sylhet';
                    if (!in_array(($number-1)%SampleCommunityContentSeeder::ORGANIZATION_COUNT,[0,5],true) || $business->slug !== $expectedSlug) continue;
                    $media = json_decode($record->getRawOriginal('public_media') ?? '[]',true);
                    if (!is_array($media) || !$media || in_array(PublicMedia::SAMPLE_SHOP_ILLUSTRATION,array_column($media,'url'),true)) continue;
                    $first = $media[0] ?? null;
                    // Refresh only an untouched, approved fixture image; leave edited/custom galleries intact.
                    if (!is_array($first) || ($first['approved_for_public']??false)!==true || ($first['kind']??null)!=='illustration'
                        || ($first['caption']??null)!=='Fictional sample illustration, not submitted evidence.'
                        || !preg_match('~\A/demo-media/(delivery|parcel|receipt|service)\.svg\z~',$first['url']??'',$asset)
                        || ($first['alt']??null)!=='Fictional sample '.$asset[1].' illustration') continue;
                    $counts[$table]++;
                    if ($this->option('apply')) {
                        $media[0] = SampleCommunityContentSeeder::shopIllustration();
                        // Exactly one media field changes: no text, timestamps, ratings, status, or alert flags.
                        DB::table($table)->where('id',$record->id)->update(['public_media'=>json_encode($media,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)]);
                    }
                }
            }
        });
        $this->info('Eligible existing fictional shop samples: '.$counts['reviews'].' reviews, '.$counts['scam_cases'].' cases.');
        $this->info($this->option('apply') ? 'Sample media refreshed. No records created; existing text and approvals preserved.' : 'Dry run: nothing written. Use --apply in local/testing to refresh eligible media.');
        return self::SUCCESS;
    }
}
