<?php
namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Models\ScamCaseEvidence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OperationsController extends Controller
{
    private function staff(Request $r, bool $admin = false): void { abort_unless(in_array($r->user()?->role, $admin ? ['admin'] : ['admin','moderator'], true), 403); }
    private function audit(Request $r, string $action, string $type, int $id, array $data = []): void {
        DB::table('audit_logs')->insert(['actor_user_id'=>$r->user()->id, 'action'=>$action, 'auditable_type'=>$type, 'auditable_id'=>$id, 'metadata'=>json_encode($data), 'created_at'=>now(), 'updated_at'=>now()]);
    }
    public function activity(Request $r) {
        return response()->json(['data'=>[
            'reviews'=>Review::where('user_id',$r->user()->id)->with(['business:id,name,slug','scamCase:id,review_id,case_code,status'])->latest()->get()->map(fn($review)=>$review->toArray()+['public_video_urls'=>\App\Support\PublicVideoLinks::visible($review->public_video_urls),'public_video_consent'=>(bool)$review->public_video_consent,'linked_case'=>$review->scamCase ? ['case_code'=>$review->scamCase->case_code,'status'=>$review->scamCase->status,'url'=>'/activity'] : null]),
            'claims'=>\App\Models\BusinessClaim::where('user_id',$r->user()->id)->with('business:id,name,slug')->get(),
            'cases'=>ScamCase::where('reporter_user_id',$r->user()->id)->with('business:id,name,bengali_name,slug,category,location,user_id')->select('id','business_id','review_id','case_code','title','summary','public_summary','amount','status','created_at','incident_type','incident_date','reporter_update','subject_response','resolution_note','resolved_at','published_at','admin_reviewed_at','alert_enabled')->latest()->get()->map(function($case){ $arr=$case->toArray(); $arr['admin_reviewed']=(bool)$case->admin_reviewed_at; $arr['evidence_count']=$case->evidence()->count(); return $arr; }),
            'saved'=>Business::whereIn('id',DB::table('saved_entities')->where('user_id',$r->user()->id)->pluck('business_id'))->select('id','name','slug')->get(),
            'my_reports'=>DB::table('content_reports')->where('reporter_user_id',$r->user()->id)->select('id','reportable_type','reportable_id','reason','details','status','admin_response','admin_responded_at','created_at','updated_at')->orderByDesc('created_at')->limit(50)->get(),
        ]]);
    }

    public function savedState(Request $r, Business $business) {
        return response()->json(['saved'=>DB::table('saved_entities')->where('user_id',$r->user()->id)->where('business_id',$business->id)->exists()]);
    }
    public function save(Request $r, Business $business) {
        $data=$r->validate(['saved'=>'required|boolean']); $keys=['user_id'=>$r->user()->id,'business_id'=>$business->id];
        if($data['saved']) DB::table('saved_entities')->updateOrInsert($keys); else DB::table('saved_entities')->where($keys)->delete();
        return response()->json(['saved'=>$data['saved']]);
    }
    public function center(Request $r) {
        return response()->json(['data'=>Business::where('user_id',$r->user()->id)->where('verified',true)->with(['reviews'=>fn($q)=>$q->where('status','published'),'cases'=>fn($q)=>$q->whereNotNull('published_at')->select('id','business_id','case_code','title','public_summary','status','created_at')])->get()]);
    }
    public function respond(Request $r, Review $review) {
        abort_unless($review->status==='published' && $review->business->verified && $review->business->user_id===$r->user()->id,403);
        $data=$r->validate(['body'=>'required|string|max:3000']);
        DB::transaction(function() use($r,$review,$data) {
            DB::table('official_responses')->updateOrInsert(['review_id'=>$review->id],$data+['user_id'=>$r->user()->id,'created_at'=>now(),'updated_at'=>now()]);
            $this->audit($r,'official_response.updated','review',$review->id,$data);
        });
        return response()->json(['message'=>'Official response published.']);
    }
    public function editReview(Request $r,Review $review) {
        abort_unless($review->user_id===$r->user()->id,403);
        $isStaff = in_array($r->user()?->role, ['admin', 'moderator'], true);
        if (!$isStaff && $review->created_at && $review->created_at->diffInMinutes(now()) > 180) {
            abort(403, 'Review information cannot be edited after 3 hours of submission.');
        }
        $data=$r->validate(\App\Support\PublicVideoLinks::rules()+[
            'title'=>'required|string|max:255',
            'body'=>'required|string|max:10000',
            'rating'=>'required|integer|min:1|max:5',
            'remove_image'=>'nullable|boolean',
            'file'=>'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:5120',
            'evidence'=>'nullable|array|max:20',
            'evidence.*'=>'required|file|mimes:jpeg,png,jpg,webp,pdf|max:5120',
        ]);
        if(array_key_exists('public_video_urls',$data))$data['public_video_urls']=\App\Support\PublicVideoLinks::visible($data['public_video_urls']);
        if(array_key_exists('public_video_urls',$data) && !array_key_exists('public_video_consent',$data))$data['public_video_consent']=false;
        
        $files = $r->file('evidence', []);
        if ($r->hasFile('file')) $files[] = $r->file('file');
        if (!empty($files)) {
            $evidencePaths = [];
            $storedPaths = [];
            foreach ($files as $file) {
                $path = $file->store('review-evidence', 'private');
                $storedPaths[] = $path;
                $evidencePaths[] = ['path' => $path, 'mime' => $file->getMimeType()];
            }
            $data['image_path'] = 'private:' . $storedPaths[0];
            $data['evidence_paths'] = $evidencePaths;
        } elseif ($r->boolean('remove_image')) {
            $data['image_path'] = null;
            $data['evidence_paths'] = null;
        }
        unset($data['file'], $data['evidence'], $data['remove_image']);

        DB::transaction(function() use($r,$review,$data) {
            $locked=Review::whereKey($review->id)->lockForUpdate()->firstOrFail();
            DB::table('review_versions')->insert(['review_id'=>$locked->id,'editor_user_id'=>$r->user()->id,'snapshot'=>json_encode($locked->only(['title','body','rating','status','public_video_urls','public_video_consent','image_path','evidence_paths'])),'created_at'=>now()]);
            $linked = $locked->scamCase()->exists();
            $locked->update($data+['edited_at'=>now()]+($linked ? ['status'=>'under_review'] : []));
            $b=$locked->business; $b->update(['rating'=>round($b->reviews()->where('status','published')->avg('rating')??0,1),'review_count'=>$b->reviews()->where('status','published')->count()]);
            $this->audit($r,'review.edited','review',$locked->id);
        }); return response()->json(['message'=>'Review updated. Previous version retained for moderation.']);
    }
    public function reports(Request $r) {
        $this->staff($r);
        $r->validate(['status'=>'nullable|in:all,open,resolved,dismissed','q'=>'nullable|string|max:255','page'=>'nullable|integer|min:1','per_page'=>'nullable|integer|min:1|max:100']);
        $query=DB::table('content_reports');
        if (($status=$r->input('status','open')) !== 'all') $query->where('status',$status);
        if ($r->filled('q')) $query->where(fn($q)=>$q->where('reason','like','%'.$r->q.'%')->orWhere('details','like','%'.$r->q.'%')->orWhere('reportable_id',$r->q)->orWhere('id',$r->q));
        return $this->queueResponse($r,$query->orderBy('created_at')->orderBy('id'));
    }
    public function moderateContent(Request $r,string $type,int $id) {
        $this->staff($r);abort_unless(in_array($type,['review','comment'],true),404);
        $data=$r->validate(['status'=>'required|in:published,limited,removed','reason'=>'required|string|max:2000']);
        DB::transaction(function()use($r,$type,$id,$data){
            $table=$type==='review'?'reviews':'review_comments';$record=DB::table($table)->where('id',$id)->lockForUpdate()->first();abort_unless($record,404);
            if($type==='review' && $data['status']==='published' && ScamCase::where('review_id',$id)->exists()) abort(422,'Publish the linked review through Admin case review with explicit reviewed public text and rationale.');
            DB::table($table)->where('id',$id)->update(['status'=>$data['status'],'updated_at'=>now()]);
            $this->audit($r,'content.'.$data['status'],$type,$id,['previous_status'=>$record->status,'reason'=>$data['reason']]);
            if($type==='review'){$b=Business::findOrFail($record->business_id);$b->update(['rating'=>round($b->reviews()->where('status','published')->avg('rating')??0,1),'review_count'=>$b->reviews()->where('status','published')->count()]);}
        });return response()->json(['message'=>'Visibility updated; content retained for review or restoration.']);
    }
    public function handleReport(Request $r,int $id) {
        $this->staff($r); $data=$r->validate(['status'=>'required|in:resolved,dismissed','decision_note'=>'required|string|max:2000','admin_response'=>'nullable|string|max:3000']);
        DB::transaction(function() use($r,$id,$data){
            $report=DB::table('content_reports')->where('id',$id)->lockForUpdate()->first();
            abort_unless($report,404);
            abort_unless($report->status==='open',409,'This report has already been closed. Refresh the queue.');
            $updateData=['status'=>$data['status'],'handled_by_user_id'=>$r->user()->id,'updated_at'=>now()];
            if(!empty($data['admin_response'])){
                $updateData['admin_response']=trim($data['admin_response']);
                $updateData['admin_responded_at']=now();
                // Notify the reporter
                DB::table('notifications')->insert(['user_id'=>$report->reporter_user_id,'type'=>'report_response','title'=>'Response to your report #'.$id,'body'=>trim($data['admin_response']),'url'=>'/activity','created_at'=>now(),'updated_at'=>now()]);
            }
            DB::table('content_reports')->where('id',$id)->update($updateData);
            $this->audit($r,'report.'.$data['status'],'report',$id,$data+['previous_status'=>$report->status,'target_visibility_changed'=>false]);
        });
        return response()->json(['message'=>'Report closed. Target visibility is unchanged; use a content decision to change it.']);
    }

    public function respondToReport(Request $r,int $id) {
        $this->staff($r);
        $data=$r->validate(['message'=>'required|string|min:5|max:3000']);
        $report=DB::table('content_reports')->where('id',$id)->first();
        abort_unless($report,404);
        DB::table('content_reports')->where('id',$id)->update(['admin_response'=>trim($data['message']),'admin_responded_at'=>now(),'updated_at'=>now()]);
        DB::table('notifications')->insert(['user_id'=>$report->reporter_user_id,'type'=>'report_response','title'=>'Response to your report #'.$id,'body'=>trim($data['message']),'url'=>'/activity','created_at'=>now(),'updated_at'=>now()]);
        $this->audit($r,'report.response_sent','report',$id,['response'=>$data['message']]);
        return response()->json(['message'=>'Response sent to reporter.']);
    }
    public function evidence(Request $r, ScamCaseEvidence $evidence) {
        $this->staff($r); $this->audit($r,'evidence.accessed','scam_case',$evidence->scam_case_id,['evidence_id'=>$evidence->id]);
        abort_unless(Storage::disk('private')->exists($evidence->storage_path),404);
        app(\App\Services\MalwareScanner::class)->scan(Storage::disk('private')->path($evidence->storage_path));
        return Storage::disk('private')->download($evidence->storage_path,'evidence-'.$evidence->id.'.'.pathinfo($evidence->storage_path,PATHINFO_EXTENSION));
    }
    public function reviewAttachments(Request $r, Review $review) {
        $this->staff($r);
        $files=$review->evidence_paths??[];
        if(!$files&&str_starts_with($review->image_path??'','private:')) $files=[['path'=>substr($review->image_path,8),'mime'=>'application/octet-stream']];
        return response()->json(['data'=>array_map(fn($file,$index)=>['index'=>$index,'type'=>$file['mime']],$files,array_keys($files))]);
    }
    public function reviewAttachment(Request $r, Review $review, int $index) {
        $this->staff($r);
        $files=$review->evidence_paths??[];
        if(!$files&&str_starts_with($review->image_path??'','private:')) $files=[['path'=>substr($review->image_path,8),'mime'=>'application/octet-stream']];
        abort_unless(isset($files[$index]),404);
        $path=$files[$index]['path'];abort_unless(Storage::disk('private')->exists($path),404);
        app(\App\Services\MalwareScanner::class)->scan(Storage::disk('private')->path($path));
        $this->audit($r,'review_evidence.accessed','review',$review->id,['index'=>$index]);
        return Storage::disk('private')->download($path,'review-'.$review->id.'-attachment-'.($index+1).'.'.pathinfo($path,PATHINFO_EXTENSION),['Cache-Control'=>'private, no-store','X-Content-Type-Options'=>'nosniff']);
    }
    public function claimEvidence(Request $r, \App\Models\BusinessClaim $businessClaim) {
        $this->staff($r, false);
        $r->validate(['kind' => 'nullable|in:proof,photo']);
        $path = $r->input('kind') === 'photo' ? $businessClaim->business_photo_path : $businessClaim->evidence_path;
        abort_unless($path, 404, 'No file recorded for this claim.');
        abort_unless(Storage::disk('private')->exists($path), 404, 'File does not exist in private storage.');
        app(\App\Services\MalwareScanner::class)->scan(Storage::disk('private')->path($path));
        $this->audit($r, 'claim_evidence.accessed', 'claim', $businessClaim->id);
        $mime = Storage::disk('private')->mimeType($path) ?: 'application/octet-stream';
        $filename = ($r->input('kind') === 'photo' ? 'storefront-photo-' : 'authority-proof-') . $businessClaim->id . '.' . pathinfo($path, PATHINFO_EXTENSION);
        return response(Storage::disk('private')->get($path), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
    public function merge(Request $r, Business $business) {
        $this->staff($r,true); $data=$r->validate(['target_id'=>'required|integer|exists:businesses,id','reason'=>'required|string|max:2000']);
        abort_if($business->id===$data['target_id'],422,'Cannot merge an entity into itself.');
        DB::transaction(function() use($r,$business,$data) {
            $target=Business::whereKey($data['target_id'])->lockForUpdate()->firstOrFail();
            abort_unless($target->status==='approved' && !$target->merged_into_id && !$business->merged_into_id,422,'Choose an active canonical entity.');
            Review::where('business_id',$business->id)->update(['business_id'=>$target->id]);
            ScamCase::where('business_id',$business->id)->update(['business_id'=>$target->id]);
            $business->update(['status'=>'rejected','merged_into_id'=>$target->id]);
            $target->update(['rating'=>round($target->reviews()->where('status','published')->avg('rating')??0,1),'review_count'=>$target->reviews()->where('status','published')->count()]);
            $this->audit($r,'entity.merged','business',$business->id,$data);
        }); return response()->json(['message'=>'Reviews and cases transferred. Original profile redirects to the canonical entity.']);
    }
    public function appeals(Request $r) {
        $this->staff($r,true);
        $r->validate(['status'=>'nullable|in:all,submitted,affirmed,reversed','q'=>'nullable|string|max:255','page'=>'nullable|integer|min:1','per_page'=>'nullable|integer|min:1|max:100']);
        $query=DB::table('appeals');
        if (($status=$r->input('status','submitted')) !== 'all') $query->where('status',$status);
        if ($r->filled('q')) $query->where(fn($q)=>$q->where('reason','like','%'.$r->q.'%')->orWhere('decision_note','like','%'.$r->q.'%')->orWhere('scam_case_id',$r->q)->orWhere('id',$r->q));
        return $this->queueResponse($r,$query->orderBy('created_at')->orderBy('id'));
    }
    public function decideAppeal(Request $r,int $id) {
        $this->staff($r,true);$data=$r->validate(['status'=>'required|in:affirmed,reversed','decision_note'=>'required|string|max:3000']);
        DB::transaction(function() use($r,$id,$data){$appeal=DB::table('appeals')->where('id',$id)->lockForUpdate()->first();abort_unless($appeal,404);abort_unless($appeal->status==='submitted',409);DB::table('appeals')->where('id',$id)->update($data+['updated_at'=>now()]);if($data['status']==='reversed')ScamCase::whereKey($appeal->scam_case_id)->update(['status'=>'restricted','decision_rationale'=>$data['decision_note']]);$this->audit($r,'appeal.'.$data['status'],'appeal',$id,$data);});
        return response()->json(['message'=>'Appeal decision recorded.']);
    }
    public function auditLog(Request $r) {
        $this->staff($r,true);
        $r->validate(['q'=>'nullable|string|max:255','actor_user_id'=>'nullable|integer|min:1','action'=>'nullable|string|max:255','date_from'=>'nullable|date','date_to'=>'nullable|date|after_or_equal:date_from','page'=>'nullable|integer|min:1','per_page'=>'nullable|integer|min:1|max:100']);
        $query=DB::table('audit_logs')->leftJoin('users as actors','actors.id','=','audit_logs.actor_user_id')->select('audit_logs.*','actors.name as actor_name','actors.email as actor_email');
        if ($r->filled('actor_user_id')) $query->where('audit_logs.actor_user_id',$r->actor_user_id);
        if ($r->filled('action')) $query->where('audit_logs.action',$r->action);
        if ($r->filled('date_from')) $query->whereDate('audit_logs.created_at','>=',$r->date_from);
        if ($r->filled('date_to')) $query->whereDate('audit_logs.created_at','<=',$r->date_to);
        if ($r->filled('q')) $query->where(fn($q)=>$q->where('audit_logs.action','like','%'.$r->q.'%')->orWhere('audit_logs.auditable_type','like','%'.$r->q.'%')->orWhere('audit_logs.auditable_id',$r->q)->orWhere('audit_logs.metadata','like','%'.$r->q.'%')->orWhere('actors.name','like','%'.$r->q.'%')->orWhere('actors.email','like','%'.$r->q.'%'));
        return $this->queueResponse($r,$query->orderByDesc('audit_logs.id'));
    }
    private function queueResponse(Request $r, $query) {
        $page=$query->paginate($r->integer('per_page',25));
        return response()->json(['data'=>$page->items(),'pagination'=>\Illuminate\Support\Arr::only($page->toArray(),['current_page','per_page','total','last_page','from','to'])]);
    }
    public function campaigns(Request $r) { $this->staff($r,true); return response()->json(['data'=>DB::table('sponsored_campaigns')->join('businesses','businesses.id','=','business_id')->select('sponsored_campaigns.*','businesses.name')->latest('sponsored_campaigns.id')->get()]); }
    public function createCampaign(Request $r) {
        $this->staff($r,true); $data=$r->validate(['business_id'=>'required|exists:businesses,id','placement'=>'required|in:search,profile','category'=>'required|string|max:255','location'=>'nullable|string|max:255','starts_at'=>'required|date','ends_at'=>'required|date|after_or_equal:starts_at','active'=>'required|boolean']);
        abort_unless(Business::whereKey($data['business_id'])->where('status','approved')->where('category',$data['category'])->exists(),422,'Choose an approved entity in the campaign category.');
        $id=DB::transaction(function() use($r,$data) { $id=DB::table('sponsored_campaigns')->insertGetId($data+['created_at'=>now(),'updated_at'=>now()]); $this->audit($r,'campaign.created','campaign',$id,$data); return $id; });
        return response()->json(['data'=>DB::table('sponsored_campaigns')->find($id)],201);
    }
    public function updateCampaign(Request $r,int $id) {
        $this->staff($r,true); $data=$r->validate(['active'=>'required|boolean']);
        abort_unless(DB::table('sponsored_campaigns')->where('id',$id)->exists(),404);
        DB::transaction(function() use($r,$id,$data) {
            DB::table('sponsored_campaigns')->where('id',$id)->update($data+['updated_at'=>now()]);
            $this->audit($r,$data['active']?'campaign.resumed':'campaign.paused','campaign',$id);
        });
        return response()->json(['message'=>'Campaign updated.']);
    }
    public function sponsored(Request $r) {
        $data=$r->validate(['category'=>'nullable|string|max:255','q'=>'nullable|string|max:255','placement'=>'required|in:search,profile']);
        $category=trim($data['category']??'');
        $categories=[];
        if ($category && !in_array($category,['All','All Categories'],true)) {
            $categories=[$category];
        } elseif ($keyword=trim($data['q']??'')) {
            // Match the same searchable fields as discovery; never promote unrelated categories.
            $categories=Business::whereIn('status',['approved','pending'])->where(function($q)use($keyword){
                foreach(['name','bengali_name','category','location','description'] as $field) $q->orWhere($field,'like','%'.$keyword.'%');
            })->distinct()->pluck('category')->all();
        }
        $items=DB::table('sponsored_campaigns')->join('businesses','businesses.id','=','business_id')->where('active',true)->where('businesses.status','approved')->whereColumn('sponsored_campaigns.category','businesses.category')->whereIn('sponsored_campaigns.category',$categories)->where('placement',$data['placement'])->whereDate('starts_at','<=',today())->whereDate('ends_at','>=',today())->orderByDesc('sponsored_campaigns.id')->select('sponsored_campaigns.id','businesses.name','businesses.slug','businesses.description','businesses.category','businesses.location')->get()->unique('slug')->take(2)->values();
        return response()->json(['data'=>$items]);
    }
    public function sponsoredShowcase(Request $r) {
        $data=$r->validate(['category'=>'nullable|string|max:255']);
        // Paid campaign approval is not a claim of licensed ownership or service quality.
        $query=DB::table('sponsored_campaigns')
            ->join('businesses','businesses.id','=','sponsored_campaigns.business_id')
            ->where('sponsored_campaigns.active',true)->where('businesses.status','approved')
            ->whereNull('businesses.merged_into_id')
            ->whereColumn('sponsored_campaigns.category','businesses.category')
            ->whereDate('sponsored_campaigns.starts_at','<=',today())
            ->whereDate('sponsored_campaigns.ends_at','>=',today());
        if(!empty($data['category'])) $query->where('businesses.category',$data['category']);
        $items=$query->select('sponsored_campaigns.id','sponsored_campaigns.business_id','businesses.name','businesses.bengali_name','businesses.slug','businesses.description','businesses.category','businesses.location','businesses.is_demo')
            ->orderByDesc('sponsored_campaigns.id')->limit(30)->get()->unique('slug')->take(9)->values();
        return response()->json(['data'=>$items,'policy'=>'Paid placement; not an endorsement, ownership check or service guarantee.']);
    }
    public function campaignEvent(Request $r,int $id) {
        $data=$r->validate(['event'=>'required|in:clicks,impressions']);
        abort_unless(DB::table('sponsored_campaigns')->where('id',$id)->where('active',true)->whereDate('starts_at','<=',today())->whereDate('ends_at','>=',today())->exists(),404);
        DB::table('sponsored_campaigns')->where('id',$id)->increment($data['event']); return response()->noContent();
    }
    public function appeal(Request $r,ScamCase $scamCase) {
        abort_unless($scamCase->reporter_user_id===$r->user()->id || $scamCase->business->user_id===$r->user()->id,403);
        $data=$r->validate(['reason'=>'required|string|max:3000']);
        DB::transaction(function()use($r,$scamCase,$data){
            ScamCase::whereKey($scamCase->id)->lockForUpdate()->firstOrFail();
            abort_if(DB::table('appeals')->where('scam_case_id',$scamCase->id)->where('user_id',$r->user()->id)->where('status','submitted')->exists(),409,'An appeal is already awaiting review.');
            DB::table('appeals')->insert($data+['scam_case_id'=>$scamCase->id,'user_id'=>$r->user()->id,'status'=>'submitted','created_at'=>now(),'updated_at'=>now()]);
        }); return response()->json(['message'=>'Appeal sent to the Admin.'],201);
    }
}
