<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessProfileImage;
use App\Services\MalwareScanner;
use App\Support\OrganizationProfileImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessProfileImageController extends Controller
{
    private function staff(Request $request, bool $adminOnly = false): void
    {
        abort_unless(in_array($request->user()?->role, $adminOnly ? ['admin'] : ['admin', 'moderator'], true), 403);
    }

    public function queue(Request $request)
    {
        $this->staff($request);
        $request->validate(['status'=>'nullable|in:all,pending,approved,rejected,revoked,superseded','q'=>'nullable|string|max:255','page'=>'nullable|integer|min:1','per_page'=>'nullable|integer|min:1|max:100']);
        $query=BusinessProfileImage::with('business');
        if (($status=$request->input('status','pending')) !== 'all') $query->where('status',$status);
        if ($request->filled('q')) $query->where(fn($q)=>$q->where('id',$request->q)->orWhere('business_id',$request->q)->orWhereHas('business',fn($b)=>$b->where('name','like','%'.$request->q.'%')));
        $page=$query->orderBy('created_at')->orderBy('id')->paginate($request->integer('per_page',25));
        return response()->json(['data' => $page->getCollection()->map(fn ($image) => [
            'id' => $image->id, 'business_id' => $image->business_id, 'name' => $image->business?->name,
            'location' => $image->business?->location, 'business_status' => $image->business?->status,
            'status' => $image->status, 'consent_confirmed' => $image->publication_consent, 'created_at' => $image->created_at,
            'preview_url' => '/api/admin/organization-images/'.$image->id.'/preview',
        ]),'pagination'=>\Illuminate\Support\Arr::only($page->toArray(),['current_page','per_page','total','last_page','from','to'])]);
    }

    public function preview(Request $request, BusinessProfileImage $organizationImage)
    {
        $this->staff($request);
        $path = OrganizationProfileImage::checkedPath($organizationImage);
        app(MalwareScanner::class)->scan($path);
        $this->audit($request, $organizationImage, 'organization_image.previewed');
        return $this->imageResponse($organizationImage, $path);
    }

    public function decide(Request $request, BusinessProfileImage $organizationImage)
    {
        $this->staff($request, true);
        $data = $request->validate(['status' => 'required|in:approved,rejected,revoked', 'reason' => 'required|string|min:10|max:2000', 'public_display_confirmed' => 'nullable|boolean']);
        DB::transaction(function () use ($request, $organizationImage, $data) {
            $image = BusinessProfileImage::lockForUpdate()->findOrFail($organizationImage->id);
            $previousStatus=$image->status;
            abort_unless($image->status === ($data['status']==='revoked'?'approved':'pending'), 409, 'This image is no longer eligible for that decision. Refresh the queue.');
            $business = Business::lockForUpdate()->findOrFail($image->business_id);
            if ($data['status'] === 'approved') {
                abort_unless($request->boolean('public_display_confirmed') && $image->publication_consent, 422, 'Confirm permission, organization identity and the absence of personal data or documents before public display.');
                app(MalwareScanner::class)->scan(OrganizationProfileImage::checkedPath($image));
                abort_unless(!$business->merged_into_id && in_array($business->status, ['approved', 'pending'], true), 409, 'This organization is not in the public directory.');
                BusinessProfileImage::where('business_id', $business->id)->where('status', 'approved')->update(['status' => 'superseded']);
                $business->update(['image' => '/api/businesses/'.$business->id.'/profile-image']);
            }
            $image->update(['status' => $data['status'], 'moderation_note' => trim($data['reason']), 'reviewed_by_user_id' => $request->user()->id, 'reviewed_at' => now()]+($data['status']==='revoked'?['publication_consent'=>false]:[]));
            if ($data['status']==='revoked' && $business->image==='/api/businesses/'.$business->id.'/profile-image' && !BusinessProfileImage::where('business_id',$business->id)->where('status','approved')->where('publication_consent',true)->exists()) $business->update(['image'=>null]);
            $this->audit($request, $image, 'organization_image.'.$data['status'], ['previous_status'=>$previousStatus, 'reason' => trim($data['reason']), 'public_display_confirmed' => $request->boolean('public_display_confirmed')]);
        });
        return response()->json(['message' => match($data['status']) {'approved'=>'Profile image approved for public display.','revoked'=>'Public profile image withdrawn; it remains private.',default=>'Profile image rejected; it remains private.'}]);
    }

    public function show(Business $business)
    {
        abort_unless(!$business->merged_into_id && in_array($business->status, ['approved', 'pending'], true), 404);

        if ($business->image && str_starts_with($business->image, '/uploads/businesses/')) {
            $hasRejected = BusinessProfileImage::where('business_id', $business->id)->where('status', 'rejected')->exists();
            if (!$hasRejected) {
                $filePath = public_path(ltrim($business->image, '/'));
                if (file_exists($filePath)) {
                    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
                    $mime = match(strtolower($ext)) {
                        'jpg', 'jpeg' => 'image/jpeg',
                        'png' => 'image/png',
                        'webp' => 'image/webp',
                        'gif' => 'image/gif',
                        'svg' => 'image/svg+xml',
                        'avif' => 'image/avif',
                        default => 'image/jpeg',
                    };
                    return response(file_get_contents($filePath), 200, [
                        'Content-Type' => $mime,
                        'Content-Disposition' => 'inline; filename="organization-profile.' . $ext . '"',
                        'Cache-Control' => 'public, max-age=86400',
                        'X-Content-Type-Options' => 'nosniff',
                    ]);
                }
            }
        }

        $image = BusinessProfileImage::where('business_id', $business->id)
            ->where('status', 'approved')
            ->latest('id')
            ->first();
        if (!$image) {
            abort(404);
        }
        return $this->imageResponse($image, OrganizationProfileImage::checkedPath($image));
    }

    private function imageResponse(BusinessProfileImage $image, string $path)
    {
        $ext = OrganizationProfileImage::MIME_EXTENSIONS[$image->mime_type] ?? 'jpg';
        return response(file_get_contents($path), 200, [
            'Content-Type' => $image->mime_type ?: 'image/jpeg',
            'Content-Disposition' => 'inline; filename="organization-profile.'.$ext.'"',
            'Cache-Control' => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function audit(Request $request, BusinessProfileImage $image, string $action, array $metadata = []): void
    {
        DB::table('audit_logs')->insert(['actor_user_id' => $request->user()->id, 'action' => $action, 'auditable_type' => BusinessProfileImage::class, 'auditable_id' => $image->id, 'metadata' => json_encode($metadata), 'created_at' => now(), 'updated_at' => now()]);
    }
}
