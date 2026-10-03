<?php

namespace App\Console\Commands;

use Database\Seeders\SampleCommunityContentSeeder;
use Illuminate\Console\Command;

class SeedSampleCommunityContent extends Command
{
    protected $signature = 'sample:community-content {--apply : Create missing sample fixtures in a local/testing database}';
    protected $description = 'Preview optional fictional organizations, reviews, and public cases; writes only with --apply';

    public function handle(): int
    {
        $this->info('Optional fictional sample content: '.SampleCommunityContentSeeder::ORGANIZATION_COUNT.' organizations across 8 divisions, '.SampleCommunityContentSeeder::REVIEW_COUNT.' reviews, '.SampleCommunityContentSeeder::CASE_COUNT.' public cases.');
        $this->line('All records are labelled sample/demo. No represented owners, real allegations, uploaded evidence, source-import attribution, or external videos are created.');
        if (!$this->option('apply')) {
            $this->info('Dry run: nothing written. In local/testing, use --apply to create missing fixtures.');
            return self::SUCCESS;
        }
        if (!app()->environment(['local', 'testing'])) {
            $this->error('Sample fixtures are restricted to local/testing environments. Nothing written.');
            return self::FAILURE;
        }
        try {
            (new SampleCommunityContentSeeder())->run();
        } catch (\Throwable $error) {
            $this->error($error->getMessage());
            return self::FAILURE;
        }
        $this->info('Missing sample fixtures created. Existing records and approvals preserved.');
        return self::SUCCESS;
    }
}
