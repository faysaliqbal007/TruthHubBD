<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessClaim;
use Illuminate\Http\Request;

class BusinessClaimController extends Controller
{
    private function admin(Request $request): void { abort_unless($request->user()?->role === 'admin', 403, 'Admin access is required.'); }

    public function store(Request $request, Business $business)
    {
        $data = $request->validate(['representative_name' => 'required|string|max:255', 'role_title' => 'required|string|max:255', 'contact_phone' => ['required','string','min:7','max:40','regex:/^[+0-9() -]+$/'],'contact_email'=>'required|email|max:255','business_address'=>'required|string|max:500','document_type'=>'required|in:trade_license,registration,authorization', 'evidence' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240','business_photo'=>'required|image|mimes:jpg,jpeg,png,webp|max:10240']);
        abort_if($business->merged_into_id || $business->status==='rejected',409,'Choose an active canonical listing.');
        
        // Rule 0: Fraudulent or disputed claimants who were banned cannot submit new claims
        abort_if($request->user()->claim_blocked, 403, 'Your account is restricted from claiming organizations due to previous invalid or disputed representation. You may continue to use TruthHub for citizen community purposes.');

        $paths=[];
        unset($data['evidence'],$data['business_photo']);
        try {
            $claim=\DB::transaction(function()use($request,$business,$data,&$paths){
                $locked=Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
                
                // Rule 1: A user who already owns another business cannot claim
                $alreadyOwns = Business::where('user_id', $request->user()->id)->where('id', '!=', $locked->id)->exists();
                abort_if($alreadyOwns, 409, 'Your account is already the verified representative of an organization. Each citizen account can only claim and represent 1 organization.');
                
                // Rule 2: A user who already has a pending or approved claim for ANOTHER business cannot claim
                $activeClaim = BusinessClaim::where('user_id', $request->user()->id)
                    ->where('business_id', '!=', $locked->id)
                    ->whereIn('status', ['submitted', 'approved'])
                    ->exists();
                abort_if($activeClaim, 409, 'You already have an active claim application under review. Each citizen account can only claim 1 organization.');
                
                $previous=BusinessClaim::where('business_id',$locked->id)->where('user_id',$request->user()->id)->first();
                if ($previous) {
                    abort_if($previous->status === 'submitted', 409, 'You already have an application under review for this organization.');
                    abort_if($previous->status === 'approved', 409, 'You are already the approved representative for this organization.');
                    // If rejected previously, allow re-submitting with new evidence
                    $previous->delete();
                }
                
                $paths[]=$proof=$request->file('evidence')->store('claim-evidence','private');
                $paths[]=$photo=$request->file('business_photo')->store('claim-evidence','private');
                return BusinessClaim::create($data+['business_id'=>$locked->id,'user_id'=>$request->user()->id,'evidence_path'=>$proof,'business_photo_path'=>$photo,'status'=>'submitted']);
            });
        }catch(\Throwable $e){\Storage::disk('private')->delete($paths);throw $e;}
        return response()->json(['success' => true, 'data' => $claim->fresh()], 201);
    }

    public function queue(Request $request)
    {
        $this->admin($request);
        $request->validate(['status'=>'nullable|in:all,submitted,approved,rejected,restricted','q'=>'nullable|string|max:255','page'=>'nullable|integer|min:1','per_page'=>'nullable|integer|min:1|max:100']);
        $query=BusinessClaim::with(['business','user']);
        if (($status=$request->input('status','submitted')) !== 'all') $query->where('status',$status);
        if ($request->filled('q')) $query->where(fn($q)=>$q->where('id',$request->q)->orWhere('business_id',$request->q)->orWhere('representative_name','like','%'.$request->q.'%')->orWhereHas('business',fn($b)=>$b->where('name','like','%'.$request->q.'%')));
        $page=$query->orderBy('created_at')->orderBy('id')->paginate($request->integer('per_page',25));
        return response()->json([
            'success' => true,
            'data' => $page->getCollection()->map(function ($claim) {
                $businessOwnerId = $claim->business?->user_id;
                $isDispute = $businessOwnerId && (int)$businessOwnerId !== (int)$claim->user_id;
                $currentOwner = $isDispute ? \App\Models\User::find($businessOwnerId) : null;
                return array_merge($claim->toArray(), [
                    'has_evidence' => (bool) $claim->evidence_path,
                    'has_photo' => (bool) $claim->business_photo_path,
                    'is_dispute' => (bool) $isDispute,
                    'current_owner_name' => $currentOwner?->name,
                    'current_owner_id' => $businessOwnerId,
                    'claimant_blocked' => (bool) $claim->user?->claim_blocked,
                ]);
            }),
            'pagination' => \Illuminate\Support\Arr::only($page->toArray(), ['current_page','per_page','total','last_page','from','to'])
        ]);
    }

    public function decide(Request $request, BusinessClaim $businessClaim)
    {
        $this->admin($request);
        $data = $request->validate(['status' => 'required|in:approved,rejected,restricted', 'decision_note' => 'required|string|max:2000']);
        \DB::transaction(function () use ($request, $businessClaim, $data) {
            $business = Business::whereKey($businessClaim->business_id)->lockForUpdate()->firstOrFail();
            $businessClaim = BusinessClaim::whereKey($businessClaim->id)->lockForUpdate()->firstOrFail();
            $allowed = [
                'submitted' => ['approved', 'rejected'],
                'approved' => ['approved', 'restricted', 'rejected'],
                'restricted' => ['approved', 'restricted', 'rejected'],
                'rejected' => ['approved', 'rejected']
            ];
            abort_unless(in_array($data['status'], $allowed[$businessClaim->status] ?? [], true), 409, 'Invalid claim status transition.');
            abort_if($data['status'] === 'approved' && $businessClaim->status === 'submitted' && (!$businessClaim->evidence_path || !$businessClaim->business_photo_path), 422, 'Proof and business photo are required before approval.');
            abort_if($data['status'] === 'approved' && Business::where('user_id', $businessClaim->user_id)->where('id', '!=', $business->id)->exists(), 409, 'This citizen account already represents another organization. Each account can only represent 1 organization.');
            
            // If admin explicitly approves this claim, lift any prior claim_blocked flag for this claimant
            if ($data['status'] === 'approved') {
                $claimant = \App\Models\User::find($businessClaim->user_id);
                if ($claimant && $claimant->claim_blocked) {
                    $claimant->update([
                        'claim_blocked' => false,
                        'claim_blocked_reason' => null
                    ]);
                }
            }

            // CASE 1: APPROVING A CLAIM
            if ($data['status'] === 'approved') {
                // If this organization is currently claimed by another user (e.g. fraudulent/mistaken initial claim),
                // revoke the previous representative's access and block them from claiming other organizations.
                if ($business->user_id && (int)$business->user_id !== (int)$businessClaim->user_id) {
                    $previousOwnerId = $business->user_id;

                    // 1. Mark previous owner's claims on this business as rejected
                    BusinessClaim::where('business_id', $business->id)
                        ->where('user_id', $previousOwnerId)
                        ->whereIn('status', ['approved', 'restricted', 'submitted'])
                        ->update([
                            'status' => 'rejected',
                            'decision_note' => 'Representation revoked by administrator: Legitimacy dispute resolved in favor of verified applicant. ' . ($data['decision_note'] ?? '')
                        ]);

                    // 2. Revert previous owner's role to 'user' and block them from claiming future organizations
                    $previousOwner = \App\Models\User::find($previousOwnerId);
                    if ($previousOwner) {
                        $updateData = [
                            'claim_blocked' => true,
                            'claim_blocked_reason' => 'Representation of "' . $business->name . '" revoked due to invalid or disputed ownership claim.'
                        ];
                        if ($previousOwner->role === 'business') {
                            $updateData['role'] = 'user';
                        }
                        $previousOwner->update($updateData);

                        // Send notification to previous owner
                        \DB::table('notifications')->insert([
                            'user_id' => $previousOwner->id,
                            'type' => 'claim_revoked',
                            'title' => 'Organization representation revoked',
                            'body' => 'Your representation of "' . $business->name . '" was revoked by an administrator following dispute verification. Your account has been restricted from claiming organizations, but you can continue using TruthHub as a community citizen.',
                            'url' => '/activity',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        \DB::table('audit_logs')->insert([
                            'actor_user_id' => $request->user()->id,
                            'action' => 'claim.revoked_and_transferred',
                            'auditable_type' => Business::class,
                            'auditable_id' => $business->id,
                            'metadata' => json_encode(['revoked_user_id' => $previousOwnerId, 'new_user_id' => $businessClaim->user_id, 'reason' => $data['decision_note']]),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }

                // Assign business to new verified representative
                $business->update(['user_id' => $businessClaim->user_id, 'verified' => true]);
                \DB::table('users')->where('id', $businessClaim->user_id)->where('role', 'user')->update(['role' => 'business']);

                // Automatically close any other pending claims from this citizen
                BusinessClaim::where('user_id', $businessClaim->user_id)
                    ->where('id', '!=', $businessClaim->id)
                    ->where('status', 'submitted')
                    ->update([
                        'status' => 'rejected',
                        'decision_note' => 'Automatically closed: Representative account has been linked to organization "' . $business->name . '". A citizen account can only represent 1 organization.'
                    ]);
            }

            // CASE 2: REVOKING AN ALREADY APPROVED/RESTRICTED CLAIM DIRECTLY
            if ($data['status'] === 'rejected' && in_array($businessClaim->status, ['approved', 'restricted'], true)) {
                if ($business->user_id === $businessClaim->user_id) {
                    $business->update(['user_id' => null, 'verified' => false]);
                }
                $revokedUser = \App\Models\User::find($businessClaim->user_id);
                if ($revokedUser) {
                    $updateData = [
                        'claim_blocked' => true,
                        'claim_blocked_reason' => $data['decision_note'] ?? 'Representation revoked by administrator.'
                    ];
                    if ($revokedUser->role === 'business') {
                        $updateData['role'] = 'user';
                    }
                    $revokedUser->update($updateData);

                    \DB::table('notifications')->insert([
                        'user_id' => $revokedUser->id,
                        'type' => 'claim_revoked',
                        'title' => 'Organization representation revoked',
                        'body' => 'Your representation of "' . $business->name . '" was revoked by an administrator. Your account has been restricted from claiming organizations, but you can continue using TruthHub as a community citizen.',
                        'url' => '/activity',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            // CASE 3: RESTRICTING AN APPROVED CLAIM
            if ($data['status'] === 'restricted') {
                $business->update(['verified' => false]);
            }

            $businessClaim->update($data + ['reviewed_by_user_id' => $request->user()->id]);
            \DB::table('audit_logs')->insert(['actor_user_id' => $request->user()->id, 'action' => 'claim.'.$data['status'], 'auditable_type' => BusinessClaim::class, 'auditable_id' => $businessClaim->id, 'metadata' => json_encode($data), 'created_at' => now(), 'updated_at' => now()]);
            \DB::table('notifications')->insert(['user_id' => $businessClaim->user_id, 'type' => 'claim_decision', 'title' => 'Your business claim was '.$data['status'], 'body' => $data['decision_note'] ?? 'Your claim has been reviewed.', 'url' => '/activity', 'created_at' => now(), 'updated_at' => now()]);
        });
        return response()->json(['success' => true, 'data' => $businessClaim->fresh()]);
    }
}
