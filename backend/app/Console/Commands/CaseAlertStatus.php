<?php
namespace App\Console\Commands;

use App\Models\ScamCase;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CaseAlertStatus extends Command
{
    protected $signature='case-alerts:status';
    protected $description='Read-only delivery totals for the dedicated in-app public-alert queue';

    public function handle(): int
    {
        $this->table(['Metric','Count'],[
            ['Active reviewed alerts',ScamCase::where('alert_enabled',true)->whereNotNull('admin_reviewed_at')->count()],
            ['Pending case-alert jobs',DB::table('jobs')->where('queue','case-alerts')->count()],
            ['Failed case-alert jobs',DB::table('failed_jobs')->where('queue','case-alerts')->count()],
            ['Delivered in-app notices',DB::table('notifications')->where('type','case_alert')->count()],
        ]);
        $this->info('Delivery requires: php artisan queue:work database --queue=case-alerts');
        return self::SUCCESS;
    }
}
