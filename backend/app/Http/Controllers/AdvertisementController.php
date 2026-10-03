<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Models\AdvertisementTickerSetting;
use App\Models\Business;
use App\Models\BusinessProfileImage;
use App\Support\AdvertisementDestination;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdvertisementController extends Controller
{
    private function admin(Request $request): void
    {
        abort_unless($request->user()?->role==='admin',403,'Admin access is required to manage advertisements.');
    }

    public function index(Request $request)
    {
        $request->validate(['sector'=>'nullable|string|max:100']);
        $query = Advertisement::with('organization')->publiclyVisible();
        if ($request->filled('sector')) $query->where('sector',$request->sector);
        return response()->json(['success'=>true,'data'=>$query->orderBy('display_order')->orderByDesc('id')->limit(100)->get()->map(fn ($ad) => $this->publicAdvertisement($ad))]);
    }

    public function ticker()
    {
        $settings=AdvertisementTickerSetting::findOrFail(1);
        $items=$settings->enabled?Advertisement::with('organization')->publiclyVisible()->where('show_in_ticker',true)->orderBy('display_order')->orderByDesc('id')->limit(100)->get()->map(fn($ad)=>$this->publicAdvertisement($ad)):[];
        return response()->json(['success'=>true,'data'=>$settings->only(['enabled','policy_en','policy_bn'])+['items'=>$items]]);
    }

    public function adminTicker(Request $request)
    {
        $this->admin($request);
        return response()->json(['success'=>true,'data'=>AdvertisementTickerSetting::findOrFail(1)->only(['enabled','policy_en','policy_bn'])]);
    }

    public function updateTicker(Request $request)
    {
        $this->admin($request);
        $data=$request->validate(['enabled'=>'required|boolean','policy_en'=>'required|string|max:1000','policy_bn'=>'required|string|max:1000','decision_rationale'=>'required|string|min:10|max:2000']);
        foreach(['policy_en','policy_bn','decision_rationale'] as $field){$data[$field]=trim($data[$field]);if(!$data[$field])throw ValidationException::withMessages([$field=>'Enter a nonblank value.']);}
        if(mb_strlen($data['decision_rationale'])<10)throw ValidationException::withMessages(['decision_rationale'=>'Explain the decision in at least 10 characters.']);
        $settings=DB::transaction(function()use($request,$data){$settings=AdvertisementTickerSetting::whereKey(1)->lockForUpdate()->firstOrFail();$before=$settings->only(['enabled','policy_en','policy_bn']);$settings->update(collect($data)->except('decision_rationale')->all());DB::table('audit_logs')->insert(['actor_user_id'=>$request->user()->id,'action'=>'advertisement.ticker_updated','auditable_type'=>AdvertisementTickerSetting::class,'auditable_id'=>1,'metadata'=>json_encode(['before'=>$before,'after'=>$settings->only(['enabled','policy_en','policy_bn']),'decision_rationale'=>$data['decision_rationale']],JSON_UNESCAPED_UNICODE),'ip_address'=>$request->ip(),'created_at'=>now(),'updated_at'=>now()]);return $settings;});
        return response()->json(['success'=>true,'data'=>$settings->only(['enabled','policy_en','policy_bn'])]);
    }

    public function adminIndex(Request $request)
    {
        $this->admin($request);
        $request->validate(['status'=>'nullable|in:draft,published,paused,archived','sector'=>'nullable|string|max:100']);
        $query = Advertisement::with('organization:id,name,bengali_name,slug,is_demo');
        if ($request->filled('status')) $query->where('status',$request->status);
        if ($request->filled('sector')) $query->where('sector',$request->sector);
        return response()->json(['success'=>true,'data'=>$query->orderBy('display_order')->orderByDesc('id')->get()]);
    }

    public function store(Request $request)
    {
        $this->admin($request);
        $data = $this->validated($request,true);
        $ad = DB::transaction(function () use ($request,$data) {
            $ad = new Advertisement(['status'=>'draft','sector'=>'general','image_source'=>'illustration','illustration_theme'=>$data['sector']??'general','bullets_en'=>[],'bullets_bn'=>[],'display_order'=>0,'is_sample'=>false]);
            $ad->fill($data);
            $this->validateCandidate($ad);
            $ad->created_by_user_id = $ad->updated_by_user_id = $request->user()->id;
            $ad->save();
            $this->audit($request,$ad,'advertisement.created',[], $ad->getAttributes());
            return $ad;
        });
        return response()->json(['success'=>true,'data'=>$ad->load('organization:id,name,bengali_name,slug,is_demo')],201);
    }

    public function update(Request $request, Advertisement $advertisement)
    {
        $this->admin($request);
        $data = $this->validated($request,false);
        $ad = DB::transaction(function () use ($request,$data,$advertisement) {
            $ad = Advertisement::whereKey($advertisement->id)->lockForUpdate()->firstOrFail();
            $before = $ad->getAttributes();
            $ad->fill($data);
            // Withdrawal must still work after a linked listing or photo loses approval.
            $this->validateCandidate($ad, in_array($data['status']??null,['paused','archived'],true));
            $ad->updated_by_user_id = $request->user()->id;
            $ad->save();
            $this->audit($request,$ad,'advertisement.updated',$before,$ad->getAttributes());
            return $ad;
        });
        return response()->json(['success'=>true,'data'=>$ad->load('organization:id,name,bengali_name,slug,is_demo')]);
    }

    public function uploadImage(Request $request)
    {
        $this->admin($request);
        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,webp,svg,gif|max:10240',
        ]);
        $file = $request->file('image');
        $dir = public_path('uploads' . DIRECTORY_SEPARATOR . 'advertisements');
        if (!file_exists($dir)) {
            @mkdir($dir, 0777, true);
        }
        @chmod($dir, 0777);
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $name = time() . '_' . Str::random(12) . '.' . $ext;
        $targetPath = $dir . DIRECTORY_SEPARATOR . $name;

        $saved = false;
        try {
            $file->move($dir, $name);
            $saved = true;
        } catch (\Throwable $e) {
            $saved = false;
        }

        if (!$saved) {
            $realPath = $file->getRealPath();
            if ($realPath && file_exists($realPath)) {
                if (!@copy($realPath, $targetPath)) {
                    @file_put_contents($targetPath, file_get_contents($realPath));
                }
            }
        }

        if (file_exists($targetPath)) {
            @chmod($targetPath, 0666);
        }
        return response()->json(['success' => true, 'url' => '/uploads/advertisements/' . $name]);
    }

    private function validated(Request $request, bool $creating): array
    {
        $presence = $creating ? 'required' : 'sometimes';
        $input = $request->all();
        if (isset($input['sector']) && is_string($input['sector'])) {
            $s = strtolower(trim($input['sector']));
            $map = [
                'health' => 'healthcare',
                'healthcare' => 'healthcare',
                'education' => 'education',
                'edu' => 'education',
                'study' => 'education',
                'learning' => 'education',
                'recruitment' => 'recruitment',
                'recruit' => 'recruitment',
                'job' => 'recruitment',
                'jobs' => 'recruitment',
                'general' => 'general',
            ];
            if (isset($map[$s])) {
                $request->merge(['sector' => $map[$s]]);
            }
        }
        $data = $request->validate([
            'title_en'=>$presence.'|required|string|max:140','title_bn'=>$presence.'|required|string|max:140',
            'body_en'=>$presence.'|required|string|max:1000','body_bn'=>$presence.'|required|string|max:1000',
            'bullets_en'=>['sometimes','nullable','array','max:3',function($attr,$val,$fail){ if(is_array($val)&&!array_is_list($val)) $fail('The '.$attr.' must be a list.'); }],
            'bullets_bn'=>['sometimes','nullable','array','max:3',function($attr,$val,$fail){ if(is_array($val)&&!array_is_list($val)) $fail('The '.$attr.' must be a list.'); }],
            'bullets_en.*'=>'required|string|min:1|max:180','bullets_bn.*'=>'required|string|min:1|max:180',
            'sector'=>'sometimes|required|string|max:100',
            'organization_id'=>'sometimes|nullable|integer|exists:businesses,id',
            'destination_url'=>['sometimes','nullable','string','max:2048',function ($attribute,$value,$fail) {
                if (AdvertisementDestination::normalize($value)===null) $fail('Use an HTTPS destination with a public hostname, without credentials, IP addresses, private hosts, or a custom port.');
            }],
            'image_source'=>'sometimes|nullable|in:illustration,organization_photo,creative_image','illustration_theme'=>'sometimes|nullable|string|max:50',
            'creative_image_path'=>'sometimes|nullable|string|max:500',
            'show_in_ticker'=>'sometimes|boolean','ticker_text_en'=>'sometimes|nullable|string|max:500','ticker_text_bn'=>'sometimes|nullable|string|max:500',
            'starts_at'=>'sometimes|nullable|date','ends_at'=>'sometimes|nullable|date','display_order'=>'sometimes|required|integer|min:0|max:10000',
            'status'=>'sometimes|required|in:draft,published,paused,archived','decision_rationale'=>'sometimes|nullable|string|min:10|max:2000',
            'is_sample'=>'missing','sample_key'=>'missing','created_by_user_id'=>'missing','updated_by_user_id'=>'missing','published_at'=>'missing',
        ]);
        foreach (['title_en','title_bn','body_en','body_bn','decision_rationale','ticker_text_en','ticker_text_bn','sector','creative_image_path'] as $field) if (isset($data[$field])) $data[$field] = trim($data[$field]);
        if (!array_key_exists('decision_rationale', $data) || $data['decision_rationale'] === null || $data['decision_rationale'] === '') {
            $data['decision_rationale'] = 'Updated via advertisement desk.';
        }
        foreach (['bullets_en','bullets_bn'] as $field) if (array_key_exists($field,$data)) $data[$field] = array_values(array_filter(array_map('trim',$data[$field]??[])));
        foreach (['starts_at','ends_at'] as $field) if (isset($data[$field])) $data[$field] = Carbon::parse($data[$field])->setTimezone(config('app.timezone'));
        if (array_key_exists('destination_url',$data)) $data['destination_url'] = $data['destination_url']===null ? null : AdvertisementDestination::normalize($data['destination_url']);
        if (!empty($data['creative_image_path'])) {
            $data['image_source'] = 'creative_image';
        }
        if (($data['image_source'] ?? null) === 'creative_image') {
            $path = $data['creative_image_path'] ?? '';
            $validPredefined = in_array($path, Advertisement::CREATIVE_IMAGES, true);
            $validUploaded = str_starts_with($path, '/uploads/advertisements/');
            if (!$validPredefined && !$validUploaded) {
                throw ValidationException::withMessages(['creative_image_path' => 'Select a valid supplied creative image or uploaded image file.']);
            }
        }
        return $data;
    }

    private function validateCandidate(Advertisement $ad, bool $withdrawing = false): void
    {
        if($ad->status==='published'&&!$ad->published_at)$ad->published_at=now();
        $errors = [];
        foreach (['title_en','title_bn','body_en','body_bn'] as $field) if (!trim($ad->$field??'')) $errors[$field] = ['Write a nonblank value for this field.'];
        if (empty($ad->decision_rationale) || mb_strlen($ad->decision_rationale)<10) $ad->decision_rationale = 'Updated via advertisement desk.';
        if ($ad->starts_at && $ad->ends_at && $ad->ends_at->lessThanOrEqualTo($ad->starts_at)) $errors['ends_at'] = ['The end must be later than the start.'];
        $organization = $ad->organization_id ? Business::whereKey($ad->organization_id)->lockForUpdate()->first() : null;
        if (!$withdrawing && $ad->organization_id && (!$organization || $organization->status!=='approved' || $organization->merged_into_id)) $errors['organization_id'] = ['Choose an approved organization that has not been merged.'];
        if (!$withdrawing && $ad->is_sample && $organization && !$organization->is_demo) $errors['organization_id'] = ['Fictional sample advertisements cannot be associated with real organizations.'];
        if ($organization?->is_demo) $ad->is_sample = true;
        if (!$withdrawing && $ad->image_source==='organization_photo' && (!$organization || !BusinessProfileImage::where('business_id',$organization->id)->where('status','approved')->where('publication_consent',true)->exists())) {
            $errors['image_source'] = ['Choose an organization with an approved, consented profile image or use a local illustration.'];
        }
        if (!empty($ad->creative_image_path)) {
            $ad->image_source = 'creative_image';
        }
        if ($errors) throw ValidationException::withMessages($errors);
    }

    private function publicAdvertisement(Advertisement $ad): array
    {
        $organization = $ad->organization;
        $photo = $ad->image_source==='organization_photo' && $organization && BusinessProfileImage::where('business_id',$organization->id)->where('status','approved')->where('publication_consent',true)->exists();
        $illustration = in_array($ad->sector, ['education','healthcare','recruitment','general'], true) ? $ad->sector : 'general';
        $imageUrl = $photo ? '/api/businesses/'.$organization->id.'/profile-image' : ($ad->creative_image_path ?: '/advertisement-media/'.$illustration.'.svg');
        $imageKind = $photo ? 'photo' : ($ad->creative_image_path ? 'creative' : 'illustration');
        return $ad->only(['id','title_en','title_bn','body_en','body_bn','sector','ticker_text_en','ticker_text_bn']) + [
            'bullets_en'=>$ad->bullets_en??[],'bullets_bn'=>$ad->bullets_bn??[],
            'is_sample'=>(bool)($ad->is_sample || $organization?->is_demo),
            'label'=>'Advertisement',
            'destination_url'=>$ad->destination_url ? AdvertisementDestination::normalize($ad->destination_url) : null,
            'starts_at'=>$ad->starts_at?->toISOString(),'ends_at'=>$ad->ends_at?->toISOString(),
            'published_at'=>$ad->published_at?->toISOString(),
            'image'=>['kind'=>$imageKind,'url'=>$imageUrl,'alt'=>$ad->title_en],
            'organization'=>$organization ? $organization->only(['id','name','bengali_name','slug']) + ['url'=>'/business/'.$organization->slug] : null,
            'display_order'=>$ad->display_order,
        ];
    }

    private function audit(Request $request, Advertisement $ad, string $action, array $before, array $after): void
    {
        DB::table('audit_logs')->insert(['actor_user_id'=>$request->user()->id,'action'=>$action,'auditable_type'=>Advertisement::class,'auditable_id'=>$ad->id,
            'metadata'=>json_encode(['before'=>$before,'after'=>$after,'decision_rationale'=>$ad->decision_rationale],JSON_UNESCAPED_UNICODE),'ip_address'=>$request->ip(),'created_at'=>now(),'updated_at'=>now()]);
    }
}
