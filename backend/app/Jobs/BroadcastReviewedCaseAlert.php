<?php

namespace App\Jobs;

use App\Models\ScamCase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class BroadcastReviewedCaseAlert implements ShouldQueue
{
    use Queueable;

    public int $tries = 10;
    public int $maxExceptions = 10;
    public int $timeout = 60;
    public array $backoff = [5, 30, 60];

    public function __construct(public int $caseId)
    {
        $this->onConnection('database')->onQueue('case-alerts');
    }

    public function retryUntil(): \DateTimeInterface
    {
        // Successful chunk releases may exceed ten attempts for a large audience;
        // genuine exceptions remain bounded separately by maxExceptions.
        return now()->addDay();
    }

    public function handle(): void
    {
        $deadline = microtime(true) + 30;
        do {
            $more = DB::transaction(function (): bool {
                // This serializes duplicate workers and moderation changes per case.
                $case = ScamCase::whereKey($this->caseId)->lockForUpdate()->first();
                if (!$case || $case->alert_broadcast_completed_at || !$case->alert_enabled
                    || !$case->admin_reviewed_at || !$case->published_at
                    || !in_array($case->status, ['published', 'under_review', 'disputed', 'resolved'], true)
                    || !trim($case->public_summary ?? '') || $case->alert_audience_max_user_id === null) {
                    return false;
                }

                // Snapshot includes all registered accounts at first promotion, regardless of role
                // or email verification. Anonymous visitors never have a users-table recipient.
                $recipients = DB::table('users')->where('id', '>', $case->alert_broadcast_last_user_id)
                    ->where('id', '<=', $case->alert_audience_max_user_id)->orderBy('id')->limit(500)->pluck('id');
                if ($recipients->isEmpty()) {
                    $case->update(['alert_broadcast_completed_at' => now()]);
                    return false;
                }

                $timestamp = now();
                $rows = $recipients->map(fn ($userId) => [
                    'user_id' => $userId, 'scam_case_id' => $case->id, 'type' => 'case_alert',
                    'title' => 'Admin-reviewed public case alert',
                    // Keep the notification useful even if the public case is later withdrawn.
                    // No allegation text, identifiers, evidence, or private rationale is copied here.
                    'body' => $case->case_code.': A reviewed public case update is available. Platform review is not a finding of legal guilt.',
                    'url' => '/scam-alerts/'.$case->case_code, 'created_at' => $timestamp, 'updated_at' => $timestamp,
                ])->all();
                // The unique database key is the final safeguard across retries and concurrent jobs.
                // insertOrIgnore leaves existing read state intact; cursor and inserts commit together.
                DB::table('notifications')->insertOrIgnore($rows);
                $case->update(['alert_broadcast_last_user_id' => $recipients->last()]);
                return true;
            }, 3);
        } while ($more && microtime(true) < $deadline);

        // Keep the same queued job for large audiences. Committed chunks survive worker retries.
        if ($more) $this->release(1);
    }
}
