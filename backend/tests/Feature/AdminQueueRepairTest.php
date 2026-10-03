<?php

namespace Tests\Feature;

use App\Models\{Business, BusinessClaim, Review, ScamCase, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminQueueRepairTest extends TestCase
{
    use RefreshDatabase;

    private function business(array $extra=[]): Business
    {
        return Business::create($extra+['name'=>'Fixture listing','slug'=>'fixture-'.Business::count(),'category'=>'Products','status'=>'pending']);
    }

    private function caseFor(Business $business, User $reporter, array $extra=[]): ScamCase
    {
        return ScamCase::create($extra+['business_id'=>$business->id,'reporter_user_id'=>$reporter->id,'case_code'=>'FIXTURE-'.ScamCase::count(),'title'=>'Private fixture title','summary'=>'Private fixture summary','status'=>'submitted']);
    }

    private function report(User $reporter, int $reviewId): int
    {
        return DB::table('content_reports')->insertGetId(['reporter_user_id'=>$reporter->id,'reportable_type'=>'review','reportable_id'=>$reviewId,'reason'=>'privacy','status'=>'open','created_at'=>now(),'updated_at'=>now()]);
    }

    public function test_pending_queue_shows_actual_submitter_and_reaches_oldest_work(): void
    {
        $this->assertSame(':memory:',config('database.connections.sqlite.database'));
        $submitter=User::factory()->create(['name'=>'Actual submitter']);
        $owner=User::factory()->create(['name'=>'Different owner']);
        $oldest=$this->business(['created_by_user_id'=>$submitter->id,'user_id'=>$owner->id,'created_at'=>now()->subDays(3)]);
        $second=$this->business(['created_by_user_id'=>$submitter->id]);
        $this->business(['status'=>'approved']);
        $this->getJson('/api/admin/pending-businesses')->assertUnauthorized();
        $this->actingAs($submitter)->getJson('/api/admin/pending-businesses')->assertForbidden();
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->getJson('/api/admin/pending-businesses?per_page=1')
            ->assertOk()->assertJsonPath('data.0.id',$oldest->id)->assertJsonPath('data.0.creator.id',$submitter->id)
            ->assertJsonPath('pagination.total',2)->assertJsonPath('pagination.last_page',2)->assertJsonCount(1,'data');
        $this->getJson('/api/admin/pending-businesses?per_page=1&page=2')->assertOk()->assertJsonPath('data.0.id',$second->id);
        $this->getJson('/api/admin/pending-businesses?per_page=101')->assertUnprocessable();
    }

    public function test_listing_decisions_require_rationale_conflict_on_second_decision_and_do_not_claim_ownership(): void
    {
        $admin=User::factory()->create(['role'=>'admin']);
        $business=$this->business();
        $url='/api/admin/businesses/'.$business->id;
        $this->actingAs($admin)->postJson($url.'/approve',[])->assertUnprocessable();
        $this->postJson($url.'/approve',['reason'=>'Private listing review rationale'])
            ->assertOk()->assertJsonPath('data.status','approved')->assertJsonPath('data.verified',false)->assertJsonPath('data.user_id',null);
        $this->postJson($url.'/reject',['reason'=>'Contradictory delayed decision'])->assertConflict();
        $this->assertDatabaseCount('audit_logs',1);
        $audit=DB::table('audit_logs')->first();
        $this->assertSame('Private listing review rationale',json_decode($audit->metadata,true)['reason']);
        $this->assertSame($admin->id,$audit->actor_user_id);
        $rejected=$this->business();
        $this->postJson('/api/admin/businesses/'.$rejected->id.'/reject',['reason'=>'No adequate listing details supplied'])->assertOk();
        $this->assertDatabaseHas('businesses',['id'=>$rejected->id,'status'=>'rejected']);
    }

    public function test_report_closure_is_single_decision_and_preserves_target_visibility(): void
    {
        $user=User::factory()->create();
        $business=$this->business(['status'=>'approved']);
        $review=Review::create(['business_id'=>$business->id,'user_id'=>$user->id,'title'=>'Fixture','body'=>'Public fixture body','rating'=>3,'status'=>'published']);
        $id=$this->report($user,$review->id);
        $url='/api/moderation/reports/'.$id;
        $this->actingAs($user)->patchJson($url,['status'=>'resolved','decision_note'=>'Inspected fixture report'])->assertForbidden();
        $moderator=User::factory()->create(['role'=>'moderator']);
        $this->actingAs($moderator)->patchJson($url,['status'=>'resolved'])->assertUnprocessable();
        $this->patchJson($url,['status'=>'resolved','decision_note'=>'Inspected fixture report'])->assertOk()->assertJsonPath('message','Report closed. Target visibility is unchanged; use a content decision to change it.');
        $this->patchJson($url,['status'=>'dismissed','decision_note'=>'Delayed contradictory report decision'])->assertConflict();
        $this->assertSame('published',$review->fresh()->status);
        $this->assertDatabaseHas('content_reports',['id'=>$id,'status'=>'resolved','handled_by_user_id'=>$moderator->id]);
        $this->assertDatabaseCount('audit_logs',1);
        $this->assertFalse(json_decode(DB::table('audit_logs')->first()->metadata,true)['target_visibility_changed']);
        $this->patchJson('/api/moderation/reports/99999',['status'=>'dismissed','decision_note'=>'Nonexistent fixture report'])->assertNotFound();
    }

    public function test_failed_audit_rolls_back_listing_and_report_decisions(): void
    {
        $user=User::factory()->create(['role'=>'admin']);
        $business=$this->business();
        $id=$this->report($user,123);
        DB::connection()->beforeExecuting(function($sql) {
            if (str_contains(strtolower($sql),'insert') && str_contains($sql,'audit_logs')) throw new \RuntimeException('Fixture audit failure.');
        });
        $this->actingAs($user)->postJson('/api/admin/businesses/'.$business->id.'/approve',['reason'=>'Fixture decision must roll back'])->assertStatus(500);
        $this->patchJson('/api/moderation/reports/'.$id,['status'=>'dismissed','decision_note'=>'Fixture closure must roll back'])->assertStatus(500);
        $this->assertSame('pending',$business->fresh()->status);
        $this->assertDatabaseHas('content_reports',['id'=>$id,'status'=>'open','handled_by_user_id'=>null]);
        $this->assertDatabaseCount('audit_logs',0);
    }

    public function test_case_and_claim_queues_page_actionable_work_and_allow_history_search(): void
    {
        $admin=User::factory()->create(['role'=>'admin']);
        $user=User::factory()->create();
        $business=$this->business();
        $first=$this->caseFor($business,$user,['created_at'=>now()->subDays(3)]);
        $second=$this->caseFor($business,$user,['status'=>'needs_evidence']);
        $historical=$this->caseFor($business,$user,['status'=>'resolved']);
        $this->actingAs($admin)->getJson('/api/moderation/scam-cases?per_page=1')->assertOk()->assertJsonPath('data.0.id',$first->id)->assertJsonPath('pagination.total',2);
        $this->getJson('/api/moderation/scam-cases?per_page=1&page=2')->assertOk()->assertJsonPath('data.0.id',$second->id);
        $this->getJson('/api/moderation/scam-cases?status=all&q='.$historical->case_code)->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.id',$historical->id);
        $claimants=User::factory()->count(3)->create();
        foreach ($claimants as $index=>$claimant) BusinessClaim::create(['business_id'=>$business->id,'user_id'=>$claimant->id,'representative_name'=>'Fixture '.$index,'role_title'=>'Representative','status'=>$index===2?'approved':'submitted','evidence_path'=>'private-fixture-proof','created_at'=>now()->subDays(3-$index)]);
        $this->getJson('/api/admin/business-claims?per_page=1')->assertOk()->assertJsonPath('data.0.representative_name','Fixture 0')->assertJsonPath('pagination.total',2)->assertDontSee('private-fixture-proof');
        $this->getJson('/api/admin/business-claims?per_page=1&page=2')->assertJsonPath('data.0.representative_name','Fixture 1');
        $this->getJson('/api/admin/business-claims?status=all&q=Fixture%202')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.status','approved');
        $this->getJson('/api/moderation/scam-cases?status=unknown')->assertUnprocessable();
        $this->getJson('/api/admin/business-claims?page=0')->assertUnprocessable();
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->getJson('/api/admin/business-claims')->assertForbidden();
    }

    public function test_report_and_appeal_queues_expose_totals_pages_and_closed_filters(): void
    {
        $admin=User::factory()->create(['role'=>'admin']);
        $business=$this->business();
        $case=$this->caseFor($business,$admin);
        $first=$this->report($admin,1);
        $second=$this->report($admin,2);
        DB::table('content_reports')->where('id',$first)->update(['created_at'=>now()->subDay()]);
        $closed=$this->report($admin,3);
        DB::table('content_reports')->where('id',$closed)->update(['status'=>'dismissed']);
        foreach (['submitted','submitted','affirmed'] as $status) DB::table('appeals')->insert(['scam_case_id'=>$case->id,'user_id'=>$admin->id,'reason'=>'Fixture appeal','status'=>$status,'created_at'=>now(),'updated_at'=>now()]);
        $this->actingAs($admin)->getJson('/api/moderation/reports?per_page=1')->assertOk()->assertJsonPath('data.0.id',$first)->assertJsonPath('pagination.total',2);
        $this->getJson('/api/moderation/reports?per_page=1&page=2')->assertJsonPath('data.0.id',$second);
        $this->getJson('/api/moderation/reports?status=dismissed')->assertJsonPath('data.0.id',$closed);
        $this->getJson('/api/admin/appeals?per_page=1&page=2')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('pagination.total',2);
        $this->getJson('/api/admin/appeals?status=all')->assertJsonPath('pagination.total',3);
    }

    public function test_audit_reader_pages_and_searches_private_rationale_and_actor(): void
    {
        $admin=User::factory()->create(['role'=>'admin','name'=>'Fixture auditor']);
        foreach (range(1,103) as $id) DB::table('audit_logs')->insert(['actor_user_id'=>$admin->id,'action'=>'fixture.reviewed','auditable_type'=>'business','auditable_id'=>$id,'metadata'=>json_encode(['reason'=>$id===1?'needle private rationale':'Fixture rationale']),'created_at'=>now(),'updated_at'=>now()]);
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->getJson('/api/admin/audit-logs')->assertForbidden();
        $this->actingAs($admin)->getJson('/api/admin/audit-logs?per_page=100&page=2')->assertOk()->assertJsonCount(3,'data')->assertJsonPath('pagination.total',103)->assertJsonPath('data.0.actor_name','Fixture auditor');
        $this->getJson('/api/admin/audit-logs?q=needle')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.auditable_id',1);
        $this->getJson('/api/admin/audit-logs?q=Fixture%20auditor&actor_user_id='.$admin->id.'&action=fixture.reviewed')->assertJsonPath('pagination.total',103);
        $this->getJson('/api/admin/audit-logs?date_from=2026-10-10&date_to=2026-10-01')->assertUnprocessable();
    }

    public function test_flags_only_case_withdrawal_preserves_status_summary_resolution_and_review(): void
    {
        $admin=User::factory()->create(['role'=>'admin']);
        $business=$this->business(['status'=>'approved']);
        foreach (['published','disputed','resolved'] as $status) {
            $case=$this->caseFor($business,$admin,['status'=>$status,'public_summary'=>'Reviewed public fixture','published_at'=>now()->subDays(2),'resolved_at'=>$status==='resolved'?now()->subDay():null,'admin_reviewed_at'=>now()->subDay(),'admin_reviewed_by_user_id'=>$admin->id,'alert_enabled'=>true,'alert_broadcast_completed_at'=>now(),'public_video_urls'=>['https://www.youtube.com/watch?v=fixture123']]);
            $resolvedAt=$case->resolved_at?->toISOString();
            $this->actingAs($admin)->patchJson('/api/moderation/scam-cases/'.$case->id,['alert_enabled'=>false,'publish_video_links'=>false,'decision_rationale'=>'Private fixture withdrawal rationale'])->assertOk()->assertJsonPath('data.status',$status)->assertJsonPath('data.public_summary','Reviewed public fixture')->assertJsonPath('data.admin_reviewed',true)->assertJsonPath('data.alert_enabled',false)->assertJsonPath('data.public_video_urls',[]);
            $this->assertSame($resolvedAt,$case->fresh()->resolved_at?->toISOString());
        }
        $this->assertDatabaseCount('notifications',0);
        $this->assertDatabaseCount('audit_logs',3);
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->patchJson('/api/moderation/scam-cases/'.$case->id,['publish_video_links'=>false])->assertForbidden();
        $this->actingAs($admin)->patchJson('/api/moderation/scam-cases/'.$case->id,['alert_enabled'=>true,'decision_rationale'=>'Missing explicit summary fixture'])->assertUnprocessable();
    }
}
