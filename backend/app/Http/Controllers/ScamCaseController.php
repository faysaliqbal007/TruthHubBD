<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\ScamCase;
use App\Models\Review;
use App\Jobs\BroadcastReviewedCaseAlert;
use App\Support\PublicVideoLinks;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Queue\DatabaseQueue;
use Illuminate\Support\Facades\Queue;

class ScamCaseController extends Controller
{
    private function staff(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'moderator'], true), 403, 'Moderator or Admin access is required.');
    }

    private function audit(Request $request, string $action, ScamCase $case, array $metadata = []): void
    {
        \DB::table('audit_logs')->insert(['actor_user_id' => $request->user()->id, 'action' => $action, 'auditable_type' => ScamCase::class, 'auditable_id' => $case->id, 'metadata'=>json_encode($metadata), 'ip_address' => $request->ip(), 'created_at' => now(), 'updated_at' => now()]);
    }

    public function index(Request $request)
    {
        $query = ScamCase::with(['business','review'])->publiclyVisible();
        $request->validate([
            'q' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'status' => 'nullable|in:trending,under_review,published,disputed,resolved',
            'incident_type' => 'nullable|string|max:255',
            'page' => 'nullable|integer|min:1',
            'period' => 'nullable|in:all,7,30,90',
            'sort' => 'nullable|in:newest,oldest,trending',
        ]);
        if ($request->status === 'trending' || $request->sort === 'trending') {
            $query->trending();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('incident_type') && $request->incident_type !== 'all') {
            $query->where('incident_type', $request->string('incident_type'));
        }
        if ($request->filled('location')) $query->whereHas('business', fn ($b) => \App\Support\DirectoryAreaFilter::apply($b, $request->input('location')));
        if ($request->filled('category') && $request->category !== 'All') $query->whereHas('business', fn ($b) => $b->where('category', 'like', '%'.$request->category.'%'));
        if ($request->filled('period') && $request->period !== 'all') $query->where('published_at','>=',now()->subDays((int)$request->period));
        if ($request->filled('q')) $query->where(function ($q) use ($request) { $q->where('case_code', 'like', '%' . $request->q . '%')->orWhere('public_summary','like','%'.$request->q.'%')->orWhereHas('business', fn ($b) => $b->where('name', 'like', '%' . $request->q . '%')->orWhere('category','like','%'.$request->q.'%')); });
        $direction = ($request->status !== 'trending' && $request->sort !== 'trending') && $request->sort === 'oldest' ? 'asc' : 'desc';
        return response()->json(['success' => true, 'data' => $query->orderBy('published_at',$direction)->orderBy('id',$direction)->paginate(20)->through(fn ($case) => $this->publicCase($case, false))]);
    }

    public function show(string $caseCode)
    {
        $case = ScamCase::with(['business','review'])
            ->publiclyVisible()
            ->where(function($q) use ($caseCode) {
                $q->where('case_code', $caseCode);
                if (is_numeric($caseCode)) {
                    $q->orWhere('id', (int)$caseCode);
                }
            })
            ->firstOrFail();
        return response()->json(['success' => true, 'data' => $this->publicCase($case, true)]);
    }

    public function businessCases(Request $request, string $slug)
    {
        $request->validate(['page'=>'nullable|integer|min:1']);
        $business = Business::publicDirectory()->where('slug', $slug)->firstOrFail();
        $cases = $business->cases()->with(['business','review'])->publiclyVisible()
            ->orderByDesc('published_at')->orderByDesc('id')->paginate(20);
        return response()->json(['success'=>true,'data'=>$cases->through(fn ($case) => $this->publicCase($case, false))]);
    }

    private function publicCase(ScamCase $case, bool $full = true): array
    {
        $review = $case->review;
        $title = $case->title ?: ('Case concerning ' . $case->business->name);
        $summary = $case->public_summary ?: ($case->summary ?: 'Citizen report registered under TruthHubBD moderation policy.');
        $data = [
            'id' => $case->id,
            'case_code' => $case->case_code,
            'title' => $title,
            'summary' => $summary,
            'status' => $case->status,
            'incident_type' => $case->incident_type,
            'incident_date' => $case->incident_date,
            'admin_reviewed' => $case->admin_reviewed,
            'alert_enabled' => $case->alert_enabled,
            'alert_requested' => (bool) $case->alert_requested,
            'published_at' => $case->published_at,
            'resolved_at' => $case->resolved_at,
            'created_at' => $case->created_at,
            'public_media' => $case->public_media,
            'translations' => (object) $case->translations,
            'is_demo' => (bool) ($case->is_demo || $case->business->is_demo),
            'events' => \DB::table('scam_case_events')->where('scam_case_id', $case->id)->where('is_public', true)->orderBy('id')->get(['status', 'summary', 'created_at']),
            'business' => [
                'id' => $case->business->id,
                'name' => $case->business->name,
                'bengali_name' => $case->business->bengali_name,
                'slug' => $case->business->slug,
                'category' => $case->business->category,
                'location' => $case->business->location,
                'user_id' => $case->business->user_id,
                'verified' => (bool) $case->business->verified,
                'image' => $case->business->image ?: (\App\Models\BusinessProfileImage::where('business_id', $case->business->id)->whereIn('status', ['approved', 'pending'])->exists() ? '/api/businesses/' . $case->business->id . '/profile-image' : null)
            ],
            'amount' => $case->amount,
            'public_video_urls' => PublicVideoLinks::visible($case->public_video_urls),
            'video_accessibility' => 'not_verified',
            'linked_review' => $review && $review->status === 'published' ? ['id' => $review->id, 'title' => $review->title, 'url' => '/reviews/' . $review->id] : null,
            'disclaimer' => 'Citizen report hosted on TruthHubBD. Platform moderation verifies factual submissions.'
        ];

        if ($full) {
            $data['subject_response'] = $case->subject_response;
            $data['reporter_update'] = $case->reporter_update;
            $data['resolution_note'] = $case->resolution_note;
            $data['is_reporter'] = auth('sanctum')->check() && auth('sanctum')->id() === $case->reporter_user_id;
            $data['is_business_owner'] = auth('sanctum')->check() && auth('sanctum')->id() === $case->business->user_id;
        }

        return $data;
    }

    public function store(Request $request, Business $business)
    {
        // Organization representatives cannot submit a scam case against their own business
        if ($business->user_id && $business->user_id === $request->user()->id) {
            abort(422, 'You cannot submit a scam case against your own organization.');
        }

        $data = $request->validate(PublicVideoLinks::rules() + [
            'title' => 'required|string|max:255',
            'summary' => 'required|string|max:5000',
            'amount' => 'nullable|numeric|min:0',
            'evidence' => 'nullable|array|max:20',
            'evidence.*' => 'file|mimes:jpg,jpeg,png,webp,pdf|max:10240',
            'alert_requested' => 'nullable|boolean'
        ]);
        $data += $request->validate(['incident_type' => 'nullable|in:non_delivery,payment,impersonation,misleading_offer,bribery,other', 'incident_date' => 'nullable|date|before_or_equal:today']);
        $storedPaths = [];
        try {
            $case = \DB::transaction(function () use ($request, $business, $data, &$storedPaths) {
                // Public citizen report
                $case = ScamCase::create([
                    'incoming_video_urls' => PublicVideoLinks::visible($data['public_video_urls'] ?? []),
                    'public_video_consent' => $request->boolean('public_video_consent'),
                    'incident_type' => $data['incident_type'] ?? null,
                    'incident_date' => $data['incident_date'] ?? null,
                    'case_code' => 'THB-' . now()->format('Y') . '-' . strtoupper(Str::random(6)),
                    'business_id' => $business->id,
                    'review_id' => null, // Completely decoupled from reviews
                    'reporter_user_id' => $request->user()->id,
                    'title' => $data['title'],
                    'summary' => $data['summary'],
                    'public_summary' => $data['summary'],
                    'status' => 'published',
                    'published_at' => now(),
                    'amount' => $data['amount'] ?? null,
                    'alert_requested' => $request->boolean('alert_requested'),
                ]);

                $publicMedia = [];
                foreach ($request->file('evidence', []) as $index => $file) {
                    $mime = $file->getMimeType();
                    $ext = strtolower($file->getClientOriginalExtension());
                    $filename = 'scam-' . $case->id . '-' . ($index + 1) . '-' . Str::random(8) . '.' . $ext;
                    $storedPath = $file->storeAs('scam-media', $filename, 'public');
                    if (!$storedPath) throw new \RuntimeException('Evidence could not be stored.');
                    $storedPaths[] = $storedPath;

                    $case->evidence()->create([
                        'uploaded_by_user_id' => $request->user()->id,
                        'storage_path' => $storedPath,
                        'mime_type' => $mime,
                        'is_private' => false
                    ]);

                    if (str_starts_with($mime, 'image/') || in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                        $publicMedia[] = [
                            'url' => '/storage/scam-media/' . $filename,
                            'alt' => 'Evidence photo ' . ($index + 1) . ' for case ' . $case->case_code,
                            'kind' => 'photo',
                            'caption' => 'Submitted evidence photo ' . ($index + 1),
                            'approved_for_public' => true,
                            'consent_confirmed' => true,
                            'redacted' => true
                        ];
                    }
                }

                if (!empty($publicMedia)) {
                    $case->update(['public_media' => $publicMedia]);
                }

                \DB::table('scam_case_events')->insert([
                    'scam_case_id' => $case->id,
                    'status' => 'published',
                    'summary' => 'Case published publicly on TruthHubBD.',
                    'is_public' => true,
                    'created_at' => now()
                ]);

                // Notify organization if it has an assigned representative user
                if ($business->user_id) {
                    \DB::table('notifications')->insert([
                        'user_id' => $business->user_id,
                        'type' => 'case_update',
                        'title' => 'Scam report filed for your organization',
                        'body' => 'A citizen filed a case (' . $case->case_code . ') concerning ' . $business->name . '. You may provide an official solution and evidence.',
                        'url' => '/scam-alerts/' . $case->case_code,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                // If user requested scam alert broadcast, notify staff
                if ($case->alert_requested) {
                    $staffIds = \DB::table('users')->whereIn('role', ['admin', 'moderator'])->pluck('id');
                    foreach ($staffIds as $staffId) {
                        \DB::table('notifications')->insert([
                            'user_id' => $staffId,
                            'type' => 'admin_scam_alert_request',
                            'title' => 'Scam Alert Broadcast Request',
                            'body' => $request->user()->name . ' requested an urgent scam alert broadcast for case ' . $case->case_code . ' (' . $business->name . ').',
                            'url' => '/scam-alerts/' . $case->case_code,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }

                $this->audit($request, 'scam_case.submitted', $case);
                return $case;
            });
        } catch (\Throwable $error) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($storedPaths);
            throw $error;
        }
        return response()->json(['success' => true, 'data' => $this->publicCase($case->fresh())], 201);
    }

    public function queue(Request $request)
    {
        $this->staff($request);
        $request->validate([
            'status' => 'nullable|in:all,actionable,submitted,needs_evidence,under_review,published,disputed,resolved,not_enough_evidence,restricted',
            'alert' => 'nullable|in:all,on,off,trending',
            'q' => 'nullable|string|max:255',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100'
        ]);
        $query = ScamCase::with(['business', 'reporter', 'evidence', 'review']);
        $status = $request->input('status', 'actionable');
        if ($status === 'actionable') $query->whereIn('status', ['submitted', 'needs_evidence', 'under_review', 'disputed']);
        elseif ($status !== 'all') $query->where('status', $status);

        if ($request->input('alert') === 'on' || $request->input('alert') === 'trending') {
            $query->where('alert_enabled', true);
        } elseif ($request->input('alert') === 'off') {
            $query->where(fn($q) => $q->where('alert_enabled', false)->orWhereNull('alert_enabled'));
        }

        if ($request->filled('q')) $query->where(fn($q) => $q->where('id', $request->q)->orWhere('case_code', 'like', '%' . $request->q . '%')->orWhere('title', 'like', '%' . $request->q . '%')->orWhereHas('business', fn($b) => $b->where('name', 'like', '%' . $request->q . '%')));
        $page = $query->orderBy('id')->paginate($request->integer('per_page', 25));
        return response()->json(['success' => true, 'data' => $page->getCollection()->map(fn ($case) => $case->toArray() + ['incoming_video_urls' => PublicVideoLinks::visible($case->incoming_video_urls), 'public_video_consent' => (bool)$case->public_video_consent, 'public_video_urls' => PublicVideoLinks::visible($case->public_video_urls)]), 'pagination' => \Illuminate\Support\Arr::only($page->toArray(), ['current_page', 'per_page', 'total', 'last_page', 'from', 'to'])]);
    }

    public function addEvidence(Request $request, ScamCase $scamCase)
    {
        $isReporter = ($scamCase->reporter_user_id === $request->user()->id);
        $isAdmin = in_array($request->user()->role, ['admin', 'moderator'], true);
        abort_unless($isReporter || $isAdmin, 403);
        if (!$isAdmin && $scamCase->status !== 'needs_evidence' && $scamCase->created_at && $scamCase->created_at->diffInMinutes(now()) > 180) {
            abort(403, 'Case evidence cannot be modified after 3 hours of submission. However, you can mark the case as resolved at any time.');
        }
        $request->validate(['evidence' => 'required|array|min:1|max:20', 'evidence.*' => 'file|mimes:jpg,jpeg,png,webp,pdf|max:10240']);
        $storedPaths = [];
        try {
            \DB::transaction(function () use ($request, $scamCase, &$storedPaths) {
                $locked = ScamCase::whereKey($scamCase->id)->lockForUpdate()->firstOrFail();
                abort_if($locked->evidence()->count() + count($request->file('evidence')) > 20, 422, 'Attach up to 20 files in total for this case.');
                foreach ($request->file('evidence') as $file) {
                    $path = $file->store('scam-evidence', 'private');
                    if (!$path) throw new \RuntimeException('Evidence could not be stored.');
                    $storedPaths[] = $path;
                    $locked->evidence()->create(['uploaded_by_user_id' => $request->user()->id, 'storage_path' => $path, 'mime_type' => $file->getMimeType(), 'is_private' => true]);
                }
                if ($locked->status === 'needs_evidence') {
                    $locked->update(['status' => 'under_review']);
                }
                $this->audit($request, 'scam_case.evidence_added', $locked);
            });
        } catch (\Throwable $error) {
            \Illuminate\Support\Facades\Storage::disk('private')->delete($storedPaths);
            throw $error;
        }
        return response()->json(['message' => 'Additional evidence submitted successfully.'], 201);
    }

    public function subjectResponse(Request $request, ScamCase $scamCase)
    {
        $isOwner = ($scamCase->business->user_id === $request->user()->id);
        $isAdmin = in_array($request->user()->role, ['admin', 'moderator'], true);
        abort_unless($isOwner || $isAdmin, 403, 'Only the organization representative or admin can submit a business solution.');

        $data = $request->validate([
            'subject_response' => 'required|string|max:5000',
            'evidence' => 'nullable|array|max:10',
            'evidence.*' => 'file|mimes:jpg,jpeg,png,webp,pdf|max:10240'
        ]);

        $storedPaths = [];
        try {
            \DB::transaction(function () use ($request, $scamCase, $data, &$storedPaths) {
                $scamCase->update([
                    'subject_response' => $data['subject_response'],
                    'status' => in_array($scamCase->status, ['resolved'], true) ? 'resolved' : 'disputed'
                ]);

                foreach ($request->file('evidence', []) as $file) {
                    $path = $file->store('scam-evidence', 'private');
                    if (!$path) throw new \RuntimeException('Evidence could not be stored.');
                    $storedPaths[] = $path;
                    $scamCase->evidence()->create([
                        'uploaded_by_user_id' => $request->user()->id,
                        'storage_path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'label' => 'Organization Evidence / Proof of Solution',
                        'is_private' => false
                    ]);
                }

                \DB::table('scam_case_events')->insert([
                    'scam_case_id' => $scamCase->id,
                    'status' => 'disputed',
                    'summary' => 'Official response & solution proposed by ' . $scamCase->business->name . '.',
                    'is_public' => true,
                    'created_at' => now()
                ]);

                // Notify reporter
                \DB::table('notifications')->insert([
                    'user_id' => $scamCase->reporter_user_id,
                    'type' => 'case_update',
                    'title' => 'Organization responded to your case',
                    'body' => $scamCase->business->name . ' posted a solution and response for ' . $scamCase->case_code . '. Review and mark as solved if satisfied.',
                    'url' => '/scam-alerts/' . $scamCase->case_code,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $this->audit($request, 'scam_case.subject_responded', $scamCase);
            });
        } catch (\Throwable $error) {
            \Illuminate\Support\Facades\Storage::disk('private')->delete($storedPaths);
            throw $error;
        }

        return response()->json(['success' => true, 'message' => 'Official response and resolution details submitted successfully.']);
    }

    public function reporterResponse(Request $request, ScamCase $scamCase)
    {
        $isReporter = ($scamCase->reporter_user_id === $request->user()->id);
        $isAdmin = in_array($request->user()->role, ['admin', 'moderator'], true);
        abort_unless($isReporter || $isAdmin, 403, 'Only the citizen reporter or an administrator can post a case update.');

        $data = $request->validate([
            'reporter_response' => 'required|string|max:5000',
        ]);

        \DB::transaction(function () use ($request, $scamCase, $data) {
            $scamCase->update([
                'reporter_update' => $data['reporter_response'],
            ]);

            \DB::table('scam_case_events')->insert([
                'scam_case_id' => $scamCase->id,
                'status' => $scamCase->status,
                'summary' => 'Citizen reporter update: ' . Str::limit($data['reporter_response'], 120),
                'is_public' => true,
                'created_at' => now(),
            ]);

            // Notify organization if it has an assigned representative user
            if ($scamCase->business->user_id) {
                \DB::table('notifications')->insert([
                    'user_id' => $scamCase->business->user_id,
                    'type' => 'case_update',
                    'title' => 'Reporter posted an update',
                    'body' => 'Citizen reporter added a response/update on case ' . $scamCase->case_code . '.',
                    'url' => '/scam-alerts/' . $scamCase->case_code,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $this->audit($request, 'scam_case.reporter_responded', $scamCase);
        });

        return response()->json(['success' => true, 'message' => 'Your update has been published successfully.', 'data' => $this->publicCase($scamCase->fresh())]);
    }

    public function resolve(Request $request, ScamCase $scamCase)
    {
        $isReporter = $scamCase->reporter_user_id === $request->user()->id;
        $isAdmin = in_array($request->user()->role, ['admin', 'moderator'], true);
        abort_unless($isReporter || $isAdmin, 403, 'Only the citizen reporter or an administrator can mark this case as solved.');

        $data = $request->validate([
            'resolution_note' => 'nullable|string|max:2000'
        ]);

        $note = $data['resolution_note'] ?? ($isReporter ? 'Marked as solved by citizen reporter.' : 'Marked as solved by administrator.');

        \DB::transaction(function () use ($request, $scamCase, $note, $isReporter) {
            $scamCase->update([
                'status' => 'resolved',
                'resolved_at' => now(),
                'resolution_note' => $note
            ]);

            \DB::table('scam_case_events')->insert([
                'scam_case_id' => $scamCase->id,
                'status' => 'resolved',
                'summary' => 'Case marked as solved by ' . ($isReporter ? 'the citizen reporter' : 'Administrator') . ': ' . $note,
                'is_public' => true,
                'created_at' => now()
            ]);

            if ($isReporter && $scamCase->business->user_id) {
                \DB::table('notifications')->insert([
                    'user_id' => $scamCase->business->user_id,
                    'type' => 'case_update',
                    'title' => 'Case marked as solved',
                    'body' => 'The reporter marked case ' . $scamCase->case_code . ' as solved.',
                    'url' => '/scam-alerts/' . $scamCase->case_code,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } elseif (!$isReporter) {
                \DB::table('notifications')->insert([
                    'user_id' => $scamCase->reporter_user_id,
                    'type' => 'case_update',
                    'title' => 'Case marked as solved by Admin',
                    'body' => 'Admin marked case ' . $scamCase->case_code . ' as solved.',
                    'url' => '/scam-alerts/' . $scamCase->case_code,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            $this->audit($request, 'scam_case.resolved', $scamCase, ['resolution_note' => $note]);
        });

        return response()->json(['success' => true, 'message' => 'Case successfully marked as solved.']);
    }

    public function transition(Request $request, ScamCase $scamCase)
    {
        $this->staff($request);

        // Moderators cannot publish, resolve, or manipulate alerts/reviews
        if ($request->has('status') && in_array($request->input('status'), ['published', 'resolved'], true)) {
            abort_unless($request->user()->role === 'admin', 403, 'Admin access required to publish or resolve a case.');
        }
        if ($request->has('alert_enabled') || $request->has('admin_reviewed') || $request->has('publish_video_links') || $request->has('publish_linked_review')) {
            abort_unless($request->user()->role === 'admin', 403, 'Admin access required for case alerts, verification, video links, or linked reviews.');
        }

        $data = $request->validate(PublicVideoLinks::rules() + [
            'status' => 'sometimes|required|in:needs_evidence,under_review,published,disputed,resolved,not_enough_evidence,restricted',
            'public_summary' => 'nullable|string|max:5000',
            'decision_rationale' => 'nullable|string|max:5000',
            'note' => 'nullable|string|max:5000',
            'reporter_update' => 'nullable|string|max:2000',
            'resolution_note' => 'nullable|string|max:2000',
            'admin_reviewed' => 'sometimes|boolean',
            'alert_enabled' => 'sometimes|boolean',
            'publish_linked_review' => 'sometimes|boolean',
            'linked_review_public_title' => 'nullable|string|max:255',
            'linked_review_public_body' => 'nullable|string|max:5000',
            'linked_review_decision_rationale' => 'nullable|string|max:5000',
            'publish_video_links' => 'sometimes|boolean',
            'public_video_urls' => 'nullable|array',
            'public_video_urls.*' => 'string'
        ]);

        $decisionRationale = trim((string)($request->input('decision_rationale') ?? $request->input('note') ?? ''));
        $publicSummary = trim((string)($request->input('public_summary') ?? ''));

        if ($request->input('status') === 'published') {
            abort_if(empty($publicSummary), 422, 'Public summary is required when publishing a case.');
            abort_if(empty($decisionRationale), 422, 'Decision rationale is required when publishing a case.');
        }

        if ($request->boolean('alert_enabled')) {
            $effectiveStatus = $request->input('status', $scamCase->status);
            abort_unless($effectiveStatus === 'published', 422, 'Alerts can only be enabled for published cases.');
            abort_unless($request->boolean('admin_reviewed', $scamCase->admin_reviewed), 422, 'Admin review is required.');
            $effectiveSummary = empty($publicSummary) ? trim((string)$scamCase->public_summary) : $publicSummary;
            abort_if(empty($effectiveSummary), 422, 'Public summary is required.');
            $effectiveRationale = empty($decisionRationale) ? trim((string)$scamCase->decision_rationale) : $decisionRationale;
            abort_if(empty($effectiveRationale), 422, 'Decision rationale is required.');
        }

        if ($request->boolean('publish_linked_review')) {
            abort_unless(filled(trim((string)$request->input('linked_review_public_title'))), 422, 'Linked review public title is required.');
            abort_unless(filled(trim((string)$request->input('linked_review_public_body'))), 422, 'Linked review public body is required.');
            abort_unless(filled(trim((string)$request->input('linked_review_decision_rationale'))), 422, 'Linked review decision rationale is required.');
        }

        if ($request->boolean('publish_video_links')) {
            abort_unless($scamCase->public_video_consent, 422, 'Reporter consent is required to publish video links.');
            $incoming = $scamCase->incoming_video_urls ?? [];
            $requested = $request->input('public_video_urls', $incoming);
            foreach ($requested as $url) {
                abort_unless(in_array($url, $incoming, true), 422, 'Published video URL must be a subset of submitted video URLs.');
            }
        }

        \DB::transaction(function () use ($request, $scamCase, $data, $decisionRationale, $publicSummary) {
            $locked = ScamCase::whereKey($scamCase->id)->lockForUpdate()->firstOrFail();
            $oldStatus = $locked->status;
            $newStatus = $data['status'] ?? $locked->status;

            $updateData = ['reviewed_by_user_id' => $request->user()->id];

            if ($request->has('status')) {
                $updateData['status'] = $newStatus;
            }
            if ($request->has('public_summary') && !empty($publicSummary)) {
                $updateData['public_summary'] = $publicSummary;
            }
            if (!empty($decisionRationale)) {
                $updateData['decision_rationale'] = $decisionRationale;
            }
            if ($request->has('reporter_update')) {
                $updateData['reporter_update'] = $data['reporter_update'];
            }
            if ($request->has('resolution_note')) {
                $updateData['resolution_note'] = $data['resolution_note'];
            }

            // Status dates
            if ($newStatus === 'resolved' && !$locked->resolved_at) {
                $updateData['resolved_at'] = now();
            } elseif ($request->has('status') && $newStatus !== 'resolved' && $locked->status === 'resolved') {
                $updateData['resolved_at'] = null;
            }

            if ($newStatus === 'published' && !$locked->published_at) {
                $updateData['published_at'] = now();
            }

            // Admin verification toggle
            if ($request->has('admin_reviewed')) {
                if ($request->boolean('admin_reviewed')) {
                    $updateData['admin_reviewed_at'] = now();
                    $updateData['admin_reviewed_by_user_id'] = $request->user()->id;
                } else {
                    $updateData['admin_reviewed_at'] = null;
                    $updateData['admin_reviewed_by_user_id'] = null;
                    $updateData['alert_enabled'] = false;
                }
            }

            // Alert enabled toggle
            if ($request->has('alert_enabled')) {
                $enabling = $request->boolean('alert_enabled');
                $updateData['alert_enabled'] = $enabling;
                if ($enabling && !$locked->alert_broadcast_started_at) {
                    $updateData['alert_audience_max_user_id'] = \DB::table('users')->max('id') ?? 0;
                    $updateData['alert_broadcast_started_at'] = now();
                    BroadcastReviewedCaseAlert::dispatch($locked->id)->onConnection('database')->onQueue('case-alerts');
                }
            }

            // Automatic alert disabling if case leaves published state or summary changes
            if (!$request->boolean('alert_enabled')) {
                if ($newStatus !== 'published' || ($request->has('admin_reviewed') && !$request->boolean('admin_reviewed')) || ($request->has('public_summary') && $locked->public_summary !== $publicSummary)) {
                    $updateData['alert_enabled'] = false;
                }
            }

            // Video links
            if ($request->boolean('publish_video_links')) {
                $incoming = $locked->incoming_video_urls ?? [];
                $updateData['public_video_urls'] = $request->input('public_video_urls', $incoming);
            } elseif ($request->has('publish_video_links') && !$request->boolean('publish_video_links')) {
                $updateData['public_video_urls'] = [];
            }

            // Linked review
            if ($request->boolean('publish_linked_review') && $locked->review_id) {
                $linkedReview = Review::findOrFail($locked->review_id);
                \DB::table('review_versions')->insert([
                    'review_id' => $linkedReview->id,
                    'editor_user_id' => $request->user()->id,
                    'snapshot' => json_encode($linkedReview->only(['title', 'body', 'rating', 'status'])),
                    'created_at' => now(),
                ]);
                $linkedReview->update([
                    'title' => $data['linked_review_public_title'],
                    'body' => $data['linked_review_public_body'],
                    'status' => 'published',
                ]);
            }

            $locked->update($updateData);

            // Add event
            $eventDesc = 'Admin updated case';
            if ($request->has('admin_reviewed')) {
                $eventDesc = $request->boolean('admin_reviewed') ? 'Case verified by TruthHubBD Admin.' : 'Admin verification status updated.';
            } elseif ($newStatus === 'resolved') {
                $eventDesc = 'Case marked as solved by Admin.';
            } elseif ($newStatus === 'published') {
                $eventDesc = 'Case reviewed and published by Admin.';
            }
            \DB::table('scam_case_events')->insert([
                'scam_case_id' => $locked->id,
                'status' => $locked->status,
                'summary' => $eventDesc,
                'is_public' => true,
                'created_at' => now()
            ]);

            // Notify reporter if private update or status changed
            if ($request->filled('reporter_update') || ($request->has('status') && $oldStatus !== $newStatus)) {
                $notifBody = $request->filled('reporter_update') ? $request->reporter_update : ('Case ' . $locked->case_code . ' status: ' . str_replace('_', ' ', $newStatus));
                \DB::table('notifications')->insert([
                    'user_id' => $locked->reporter_user_id,
                    'type' => 'case_update',
                    'title' => 'Update on your case ' . $locked->case_code,
                    'body' => $notifBody,
                    'url' => '/scam-alerts/' . $locked->case_code,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            $auditAction = ($newStatus === 'published' || $request->input('status') === 'published') ? 'scam_case.published' : 'scam_case.updated';
            $this->audit($request, $auditAction, $locked, $data + ['decision_rationale' => $decisionRationale]);
        });

        $scamCase->refresh();
        return response()->json(['success' => true, 'data' => $scamCase->toArray() + ['incoming_video_urls' => PublicVideoLinks::visible($scamCase->incoming_video_urls), 'public_video_consent' => (bool)$scamCase->public_video_consent, 'public_video_urls' => PublicVideoLinks::visible($scamCase->public_video_urls)]]);
    }

    public function myCase(Request $request, string $caseCode)
    {
        $case = ScamCase::with(['business', 'review', 'evidence'])
            ->where('case_code', $caseCode)
            ->where('reporter_user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $case->id,
                'case_code' => $case->case_code,
                'title' => $case->title,
                'summary' => $case->summary,
                'public_summary' => $case->public_summary,
                'status' => $case->status,
                'amount' => $case->amount,
                'incident_type' => $case->incident_type,
                'incident_date' => $case->incident_date,
                'reporter_update' => $case->reporter_update,
                'subject_response' => $case->subject_response,
                'resolution_note' => $case->resolution_note,
                'admin_reviewed' => (bool) $case->admin_reviewed,
                'alert_enabled' => (bool) $case->alert_enabled,
                'created_at' => $case->created_at,
                'published_at' => $case->published_at,
                'resolved_at' => $case->resolved_at,
                'is_demo' => (bool) $case->is_demo,
                'business' => $case->business ? [
                    'id' => $case->business->id,
                    'name' => $case->business->name,
                    'bengali_name' => $case->business->bengali_name,
                    'slug' => $case->business->slug,
                    'category' => $case->business->category,
                    'location' => $case->business->location,
                    'user_id' => $case->business->user_id,
                ] : null,
                'evidence_count' => $case->evidence()->count(),
                'timeline' => [
                    ['title' => 'Report Submitted', 'date' => $case->created_at ? $case->created_at->format('Y-m-d') : null, 'done' => true],
                    ['title' => 'Staff Verification', 'date' => $case->created_at ? $case->created_at->format('Y-m-d') : null, 'done' => in_array($case->status, ['under_review', 'published', 'disputed', 'resolved'], true)],
                    ['title' => 'Public Alert Published', 'date' => $case->published_at ? $case->published_at->format('Y-m-d') : null, 'done' => in_array($case->status, ['published', 'disputed', 'resolved'], true) && $case->published_at !== null],
                    ['title' => 'Resolution & Outcome', 'date' => $case->resolved_at ? $case->resolved_at->format('Y-m-d') : null, 'done' => $case->status === 'resolved'],
                ],
            ]
        ]);
    }
}
