<?php

namespace Tests\Feature;

use App\Jobs\BroadcastReviewedCaseAlert;
use App\Models\Business;
use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ReviewedCaseAlertsTest extends TestCase
{
    use RefreshDatabase;

    private function caseFor(array $extra = []): ScamCase
    {
        $business = Business::create(['name'=>'Fictional alert test organization','slug'=>'alert-test-'.Business::count(),'category'=>'Products','status'=>'approved']);
        $reporter = User::factory()->create();
        return ScamCase::create($extra + ['business_id'=>$business->id,'reporter_user_id'=>$reporter->id,'case_code'=>'ALERT-'.ScamCase::count(),'title'=>'private-title-marker','summary'=>'private-summary-marker','decision_rationale'=>'private-rationale-marker','status'=>'published','published_at'=>now(),'public_summary'=>'An approved redacted summary.']);
    }

    private function approve(ScamCase $case, array $extra = [])
    {
        return $this->patchJson('/api/moderation/scam-cases/'.$case->id, $extra + [
            'status'=>'published','public_summary'=>'An approved redacted summary.',
            'decision_rationale'=>'private-rationale-marker','admin_reviewed'=>true,'alert_enabled'=>true,
        ]);
    }

    public function test_publication_and_admin_review_alone_never_broadcast_and_old_cases_are_disabled(): void
    {
        Queue::fake();
        $case = $this->caseFor(['status'=>'submitted','published_at'=>null]);
        $this->assertFalse($case->fresh()->alert_enabled);
        $this->actingAs(User::factory()->create(['role'=>'admin']))->patchJson('/api/moderation/scam-cases/'.$case->id,[
            'status'=>'published','public_summary'=>'Redacted public version.','decision_rationale'=>'private-rationale-marker',
        ])->assertOk()->assertJsonPath('data.admin_reviewed',false)->assertJsonPath('data.alert_enabled',false);
        $this->approve($case,['public_summary'=>'Redacted public version.','alert_enabled'=>false])->assertOk()->assertJsonPath('data.admin_reviewed',true);
        Queue::assertNothingPushed();
        $this->assertSame(0,DB::table('notifications')->where('type','case_alert')->count());
    }

    public function test_guests_users_and_moderators_cannot_promote_cases(): void
    {
        Queue::fake();
        $case = $this->caseFor();
        $this->approve($case)->assertUnauthorized();
        foreach (['user','moderator'] as $role) {
            $this->actingAs(User::factory()->create(['role'=>$role]));
            $this->approve($case,['status'=>'under_review'])->assertForbidden();
            $this->patchJson('/api/moderation/scam-cases/'.$case->id,['status'=>'under_review','alert_enabled'=>false])->assertForbidden();
        }
        $this->assertFalse($case->fresh()->admin_reviewed);
        $this->assertFalse($case->fresh()->alert_enabled);
        Queue::assertNothingPushed();
    }

    public function test_promotion_requires_publication_explicit_review_summary_and_private_rationale(): void
    {
        Queue::fake();
        $case = $this->caseFor(['status'=>'submitted','published_at'=>null]);
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $this->approve($case,['status'=>'under_review'])->assertUnprocessable();
        foreach ([['public_summary'=>' '],['decision_rationale'=>' '],['admin_reviewed'=>false]] as $invalid) {
            $this->approve($case,$invalid)->assertUnprocessable();
        }
        $this->assertNull($case->fresh()->published_at);
        $this->assertFalse($case->fresh()->alert_enabled);
        Queue::assertNothingPushed();
        $this->approve($case)->assertOk()->assertJsonPath('data.admin_reviewed',true)->assertJsonPath('data.alert_enabled',true);
        Queue::assertPushed(BroadcastReviewedCaseAlert::class, fn ($job) => $job->caseId === $case->id && $job->connection === 'database' && $job->queue === 'case-alerts');
        $this->assertDatabaseHas('audit_logs',['auditable_id'=>$case->id,'action'=>'scam_case.published']);
        $this->assertNotNull($case->fresh()->admin_reviewed_by_user_id);
    }

    public function test_all_registered_roles_receive_only_generic_public_notifications_and_future_accounts_do_not(): void
    {
        Queue::fake();
        $case = $this->caseFor();
        $admin = User::factory()->create(['role'=>'admin']);
        User::factory()->create(['role'=>'moderator']);
        User::factory()->create(['email_verified_at'=>null]);
        $expected = User::count();
        $this->actingAs($admin);
        $this->approve($case)->assertOk();
        $future = User::factory()->create();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $rows = DB::table('notifications')->where('type','case_alert')->get();
        $this->assertCount($expected,$rows);
        $this->assertFalse($rows->contains('user_id',$future->id));
        foreach ($rows as $row) {
            $this->assertSame('/scam-alerts/'.$case->case_code,$row->url);
            $this->assertStringNotContainsString('private-',$row->body.$row->title);
            $this->assertStringNotContainsString('approved redacted summary',$row->body);
            $this->assertStringContainsString('not a finding of legal guilt',$row->body);
        }
        $this->assertNotNull($case->fresh()->alert_broadcast_completed_at);
        $this->getJson('/api/scam-cases/'.$case->case_code)->assertOk()->assertJsonPath('data.admin_reviewed',true)->assertJsonPath('data.alert_enabled',true)
            ->assertJsonMissingPath('data.decision_rationale')->assertJsonMissingPath('data.admin_reviewed_by_user_id')->assertJsonMissingPath('data.reporter_user_id')
            ->assertDontSee('private-');
        $this->actingAs($future)->getJson('/api/notifications')->assertOk()->assertJsonCount(0,'data');
    }

    public function test_guest_reading_is_public_but_notifications_and_all_writes_require_authentication(): void
    {
        $case = $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>true]);
        $this->getJson('/api/scam-cases?status=trending')->assertOk()->assertJsonCount(1,'data.data')->assertDontSee('private-');
        $this->getJson('/api/scam-cases/'.$case->case_code)->assertOk()->assertDontSee('private-');
        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->patchJson('/api/notifications/1/read')->assertUnauthorized();
        $this->postJson('/api/businesses/'.$case->business_id.'/scam-cases',[])->assertUnauthorized();
        $this->postJson('/api/reports',[])->assertUnauthorized();
        $this->putJson('/api/businesses/'.$case->business_id.'/saved',[])->assertUnauthorized();
        $this->putJson('/api/reviews/1/reaction',['type'=>'helpful'])->assertUnauthorized();
    }

    public function test_retry_duplicate_workers_and_reenable_never_duplicate_or_reset_read_state(): void
    {
        Queue::fake();
        $case = $this->caseFor();
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $this->approve($case)->assertOk();
        $this->approve($case)->assertOk();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $count = DB::table('notifications')->where('type','case_alert')->count();
        $first = DB::table('notifications')->where('type','case_alert')->first();
        DB::table('notifications')->where('id',$first->id)->update(['read_at'=>now()]);
        // Simulate a interrupted worker restarted from an earlier committed progress cursor.
        $case->update(['alert_broadcast_last_user_id'=>0,'alert_broadcast_completed_at'=>null]);
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $this->patchJson('/api/moderation/scam-cases/'.$case->id,['status'=>'published','public_summary'=>'An approved redacted summary.','decision_rationale'=>'Withdraw alert placement.','alert_enabled'=>false])->assertOk();
        $this->approve($case)->assertOk();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $this->assertSame($count,DB::table('notifications')->where('type','case_alert')->count());
        $this->assertNotNull(DB::table('notifications')->where('id',$first->id)->value('read_at'));
    }

    public function test_trending_requires_both_flags_and_publication_and_is_newest_with_stable_ties(): void
    {
        $old = $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>true,'published_at'=>now()->subDays(2)]);
        $new = $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>true,'published_at'=>now()->subDay()]);
        $tie = $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>true,'published_at'=>$new->published_at]);
        $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>false]);
        $this->caseFor(['alert_enabled'=>true]);
        $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>true,'status'=>'restricted']);
        $this->caseFor(['admin_reviewed_at'=>now(),'alert_enabled'=>true,'status'=>'submitted','published_at'=>null]);
        $this->getJson('/api/scam-cases?status=trending&sort=oldest')->assertOk()->assertJsonCount(3,'data.data')
            ->assertJsonPath('data.data.0.id',$tie->id)->assertJsonPath('data.data.1.id',$new->id)->assertJsonPath('data.data.2.id',$old->id)->assertDontSee('private-');
        $this->getJson('/api/scam-cases?status=trending&period=7&q=missing')->assertOk()->assertJsonCount(0,'data.data');
    }

    public function test_public_newest_and_oldest_order_use_publication_dates_and_stable_id_ties(): void
    {
        $old = $this->caseFor(['published_at'=>now()->subDays(3)]);
        $new = $this->caseFor(['published_at'=>now()->subDay()]);
        $tie = $this->caseFor(['published_at'=>$new->published_at]);
        $this->caseFor(['status'=>'restricted','published_at'=>now()->subDays(4)]);
        $this->getJson('/api/scam-cases?sort=oldest')->assertOk()->assertJsonCount(3,'data.data')
            ->assertJsonPath('data.data.0.id',$old->id)->assertJsonPath('data.data.1.id',$new->id)->assertJsonPath('data.data.2.id',$tie->id)->assertDontSee('private-');
        $this->getJson('/api/scam-cases?sort=newest')->assertOk()->assertJsonCount(3,'data.data')
            ->assertJsonPath('data.data.0.id',$tie->id)->assertJsonPath('data.data.1.id',$new->id)->assertJsonPath('data.data.2.id',$old->id)->assertDontSee('private-');
        $this->getJson('/api/scam-cases?sort=bad')->assertUnprocessable();
    }

    public function test_unpublished_revoked_and_changed_summaries_stop_pending_delivery(): void
    {
        Queue::fake();
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        foreach (['restricted','disable','revoke','edit'] as $action) {
            $case = $this->caseFor();
            $this->approve($case)->assertOk();
            $payload = ['status'=>'under_review','decision_rationale'=>'Private safety check.'];
            if ($action === 'restricted') $payload['status'] = 'restricted';
            if ($action === 'disable') $payload['alert_enabled'] = false;
            if ($action === 'revoke') $payload['admin_reviewed'] = false;
            if ($action === 'edit') $payload['public_summary'] = 'A revised summary requiring fresh review.';
            $this->patchJson('/api/moderation/scam-cases/'.$case->id,$payload)->assertOk()->assertJsonPath('data.alert_enabled',false);
            (new BroadcastReviewedCaseAlert($case->id))->handle();
            $this->assertSame(0,DB::table('notifications')->where('scam_case_id',$case->id)->where('type','case_alert')->count());
        }
    }

    public function test_delivery_progresses_across_multiple_chunks_and_missing_cases_are_safe(): void
    {
        Queue::fake();
        $case = $this->caseFor();
        User::factory()->count(505)->create();
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $this->approve($case)->assertOk();
        $expected = User::count();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $this->assertSame($expected,DB::table('notifications')->where('type','case_alert')->count());
        $this->assertSame((int)User::max('id'),(int)$case->fresh()->alert_broadcast_last_user_id);
        $this->assertNotNull($case->fresh()->alert_broadcast_completed_at);
        (new BroadcastReviewedCaseAlert(PHP_INT_MAX))->handle();
        $this->assertSame($expected,DB::table('notifications')->where('type','case_alert')->count());
    }

    public function test_failed_chunk_rolls_back_notifications_and_progress_then_retries_safely(): void
    {
        Queue::fake();
        $case = $this->caseFor();
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $this->approve($case)->assertOk();
        $failOnce = true;
        DB::listen(function ($query) use (&$failOnce) {
            if ($failOnce && str_contains(strtolower($query->sql),'insert') && str_contains($query->sql,'notifications') && in_array('case_alert',$query->bindings,true)) {
                $failOnce = false;
                throw new \RuntimeException('Simulated interrupted notification chunk.');
            }
        });
        try {
            (new BroadcastReviewedCaseAlert($case->id))->handle();
            $this->fail('The simulated chunk failure must propagate for queue retry.');
        } catch (\RuntimeException $error) {
            $this->assertSame('Simulated interrupted notification chunk.',$error->getMessage());
        }
        $this->assertSame(0,DB::table('notifications')->where('type','case_alert')->count());
        $this->assertSame(0,(int)$case->fresh()->alert_broadcast_last_user_id);
        $this->assertNull($case->fresh()->alert_broadcast_completed_at);
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $this->assertSame(User::count(),DB::table('notifications')->where('type','case_alert')->count());
        $this->assertNotNull($case->fresh()->alert_broadcast_completed_at);
    }

    public function test_database_unique_key_rejects_duplicate_case_alerts_independently_of_worker_locks(): void
    {
        $case = $this->caseFor();
        $row = ['user_id'=>$case->reporter_user_id,'scam_case_id'=>$case->id,'type'=>'case_alert','title'=>'Reviewed public case','body'=>'Generic public update.','created_at'=>now(),'updated_at'=>now()];
        DB::table('notifications')->insert($row);
        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        DB::table('notifications')->insert($row);
    }

    public function test_repeated_publication_promotion_does_not_duplicate_reporter_status_notices(): void
    {
        Queue::fake();
        $case = $this->caseFor(['status'=>'submitted','published_at'=>null]);
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $this->approve($case)->assertOk();
        $this->approve($case)->assertOk();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        (new BroadcastReviewedCaseAlert($case->id))->handle();
        $this->assertSame(1,DB::table('notifications')->where('user_id',$case->reporter_user_id)->where('type','case_update')->count());
        $this->assertSame(1,DB::table('notifications')->where('user_id',$case->reporter_user_id)->where('type','case_alert')->count());
    }

    public function test_database_queue_row_and_admin_decision_commit_or_roll_back_together(): void
    {
        $case = $this->caseFor();
        $this->actingAs(User::factory()->create(['role'=>'admin']));
        $this->approve($case)->assertOk();
        $this->assertDatabaseHas('jobs',['queue'=>'case-alerts']);
        $other = $this->caseFor();
        $failOnce = true;
        DB::listen(function ($query) use (&$failOnce) {
            if ($failOnce && str_contains(strtolower($query->sql),'insert') && str_contains($query->sql,'jobs')) {
                $failOnce = false;
                throw new \RuntimeException('Simulated queue insertion failure.');
            }
        });
        $this->approve($other)->assertStatus(500);
        $this->assertFalse($other->fresh()->alert_enabled);
        $this->assertFalse($other->fresh()->admin_reviewed);
        $this->assertNull($other->fresh()->alert_broadcast_started_at);
        $this->assertDatabaseCount('jobs',1);
    }
}
