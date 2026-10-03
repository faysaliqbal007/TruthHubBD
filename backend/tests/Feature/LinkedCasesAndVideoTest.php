<?php

namespace Tests\Feature;

use App\Models\{Business, Review, ScamCase, User};
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LinkedCasesAndVideoTest extends TestCase
{
    use RefreshDatabase;

    private function organization(string $slug = 'example-organization'): Business
    {
        return Business::create(['name'=>'Fictional test organization','slug'=>$slug,'category'=>'Products','status'=>'approved','location'=>'Dhaka']);
    }

    private function user(string $role = 'user'): User
    {
        return User::factory()->create(['role'=>$role,'email_verified_at'=>now()]);
    }

    private function reviewPayload(array $overrides = []): array
    {
        return array_replace(['title'=>'Private submission marker','body'=>'Private initial allegation marker','rating'=>2], $overrides);
    }

    private function publishPayload(array $overrides = []): array
    {
        return array_replace(['status'=>'published','public_summary'=>'Redacted platform-reviewed report.','decision_rationale'=>'Private screening rationale marker'], $overrides);
    }

    public function test_reviews_and_scam_cases_are_strictly_decoupled(): void
    {
        $business=$this->organization();
        $response=$this->actingAs($this->user(),'sanctum')->postJson('/api/businesses/'.$business->id.'/reviews',$this->reviewPayload(['request_scam_alert'=>true]));
        $response->assertCreated()->assertJsonPath('data.status','published');
        $this->assertDatabaseCount('scam_cases', 0);
        $this->getJson('/api/businesses/'.$business->slug)->assertOk()->assertJsonCount(1,'data.reviews');
    }

    public function test_video_links_are_normalized_only_published_with_review_consent_and_never_fetched(): void
    {
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        $business=$this->organization();$this->actingAs($this->user(),'sanctum');
        $link='https://youtu.be/dQw4w9WgXcQ?si=tracking';
        $canonical='https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $first=$this->postJson('/api/businesses/'.$business->id.'/reviews',$this->reviewPayload(['public_video_urls'=>[$link]]))->assertCreated();
        $this->getJson('/api/reviews/'.$first->json('data.id'))->assertJsonCount(0,'data.public_video_urls');
        $second=$this->postJson('/api/businesses/'.$business->id.'/reviews',$this->reviewPayload(['public_video_urls'=>[$link,$canonical],'public_video_consent'=>true]))->assertCreated();
        $this->getJson('/api/reviews/'.$second->json('data.id'))->assertJsonCount(1,'data.public_video_urls')->assertJsonPath('data.public_video_urls.0',$canonical)->assertJsonPath('data.video_accessibility','not_verified');
        \Illuminate\Support\Facades\Http::assertNothingSent();
    }

    public function test_malformed_private_credentialed_and_non_video_urls_and_uploaded_videos_are_rejected(): void
    {
        $business=$this->organization();$this->actingAs($this->user(),'sanctum');
        $invalid=['http://youtu.be/dQw4w9WgXcQ','https://user:password@www.youtube.com/watch?v=dQw4w9WgXcQ','https://127.0.0.1/video/1','https://localhost/video/1','https://[::1]/video/1','https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://www.youtube.com/channel/example','https://www.youtube.com/watch?v[]=dQw4w9WgXcQ','https://www.youtube.com:443/watch?v=dQw4w9WgXcQ','https://youtu.be/dQw4w9WgXcQ#private','https://www.youtube.com%2fevil.test/watch?v=dQw4w9WgXcQ','https://www.youtube.com\\@evil.test/watch?v=dQw4w9WgXcQ','https://youtu.be/dQw4w9WgXcQ%0a','javascript:alert(1)'];
        foreach($invalid as $link){
            $this->postJson('/api/businesses/'.$business->id.'/reviews',$this->reviewPayload(['public_video_urls'=>[$link],'public_video_consent'=>true]))->assertUnprocessable();
            $this->postJson('/api/businesses/'.$business->id.'/scam-cases',['title'=>'Report','summary'=>'Report','public_video_urls'=>[$link],'public_video_consent'=>true])->assertUnprocessable();
        }
        $links=array_fill(0,4,'https://vimeo.com/12345');
        $this->postJson('/api/businesses/'.$business->id.'/reviews',$this->reviewPayload(['public_video_urls'=>$links]))->assertUnprocessable();
        $this->postJson('/api/businesses/'.$business->id.'/reviews',$this->reviewPayload(['evidence'=>[\Illuminate\Http\UploadedFile::fake()->create('video.mp4',10,'video/mp4')]]))->assertUnprocessable();
        $this->assertDatabaseCount('reviews',0);$this->assertDatabaseCount('scam_cases',0);
    }

    public function test_case_video_links_require_consent_and_explicit_admin_subset_approval(): void
    {
        $business=$this->organization();$this->actingAs($this->user(),'sanctum');
        $first=$this->postJson('/api/businesses/'.$business->id.'/scam-cases',['title'=>'Report','summary'=>'Private','public_video_urls'=>['https://vimeo.com/12345']])->assertCreated();
        $second=$this->postJson('/api/businesses/'.$business->id.'/scam-cases',['title'=>'Report','summary'=>'Private','public_video_urls'=>['https://vimeo.com/12345','https://www.youtube.com/watch?v=dQw4w9WgXcQ'],'public_video_consent'=>true])->assertCreated();
        $this->actingAs($this->user('admin'),'sanctum');
        $url='/api/moderation/scam-cases/'.$second->json('data.id');
        $this->patchJson('/api/moderation/scam-cases/'.$first->json('data.id'),$this->publishPayload(['publish_video_links'=>true]))->assertUnprocessable();
        $this->patchJson($url,$this->publishPayload())->assertOk();
        $this->getJson('/api/scam-cases/'.$second->json('data.case_code'))->assertJsonCount(0,'data.public_video_urls')->assertDontSee('vimeo.com');
        $this->patchJson($url,$this->publishPayload(['publish_video_links'=>true,'public_video_urls'=>['https://vimeo.com/99999']]))->assertUnprocessable();
        $this->patchJson($url,$this->publishPayload(['publish_video_links'=>true,'public_video_urls'=>['https://vimeo.com/12345']]))->assertOk();
        $this->getJson('/api/scam-cases/'.$second->json('data.case_code'))->assertJsonCount(1,'data.public_video_urls')->assertJsonPath('data.public_video_urls.0','https://vimeo.com/12345')->assertDontSee('dQw4w9WgXc')->assertDontSee('Private screening rationale marker');
    }


    public function test_organization_cases_are_paginated_scoped_and_exclude_never_approved_or_restricted_cases(): void
    {
        $business=$this->organization();$other=$this->organization('other');$reporter=$this->user();
        foreach(['published','under_review','disputed','resolved','submitted','restricted','not_enough_evidence'] as $index=>$status){
            ScamCase::create(['case_code'=>'STATUS-'.$index,'business_id'=>$business->id,'reporter_user_id'=>$reporter->id,'title'=>'Private title','summary'=>'Private secret','public_summary'=>'Approved redacted report','status'=>$status,'published_at'=>$status==='submitted'?null:now()]);
        }
        ScamCase::create(['case_code'=>'OTHER','business_id'=>$other->id,'reporter_user_id'=>$reporter->id,'title'=>'Private','summary'=>'Private','public_summary'=>'Other organization','status'=>'published','published_at'=>now()]);
        $this->getJson('/api/businesses/'.$business->slug.'/scam-cases')->assertOk()->assertJsonCount(4,'data.data')->assertDontSee('OTHER')->assertDontSee('Private secret');
        $this->getJson('/api/businesses/missing/scam-cases')->assertNotFound();
        $business->update(['status'=>'rejected']);
        $this->getJson('/api/businesses/'.$business->slug.'/scam-cases')->assertNotFound();
    }

    public function test_claimable_search_excludes_represented_organizations_before_counting(): void
    {
        $unclaimed=$this->organization();$represented=$this->organization('represented');$verified=$this->organization('verified');
        $represented->update(['user_id'=>$this->user()->id]);$verified->update(['verified'=>true]);
        $this->getJson('/api/businesses?claimable=1&limit=1')->assertOk()->assertJsonPath('total',1)->assertJsonPath('data.0.id',$unclaimed->id);
    }

    public function test_migration_preserves_duplicate_case_records_and_prior_publication(): void
    {
        $migration=require database_path('migrations/2026_10_01_000000_link_reviews_and_public_video.php');
        $migration->down();
        $business=$this->organization();$author=$this->user();
        $review=Review::create(['business_id'=>$business->id,'user_id'=>$author->id,'author'=>'Test','rating'=>3,'title'=>'Test','body'=>'Test','status'=>'published']);
        $pending=ScamCase::create(['case_code'=>'OLD-PENDING','business_id'=>$business->id,'review_id'=>$review->id,'reporter_user_id'=>$author->id,'title'=>'Pending retained','summary'=>'Pending retained']);
        $public=ScamCase::create(['case_code'=>'OLD-PUBLIC','business_id'=>$business->id,'review_id'=>$review->id,'reporter_user_id'=>$author->id,'title'=>'Private','summary'=>'Private','public_summary'=>'Prior approval retained','status'=>'published','published_at'=>now()]);
        $migration->up();
        $this->assertDatabaseCount('scam_cases',2);
        $this->assertDatabaseHas('scam_cases',['id'=>$public->id,'review_id'=>$review->id,'status'=>'published','public_summary'=>'Prior approval retained']);
        $this->assertDatabaseHas('scam_cases',['id'=>$pending->id,'review_id'=>null,'legacy_review_id'=>$review->id,'summary'=>'Pending retained']);
    }
}
