<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * BusinessController
 * Handles API endpoints for searching businesses, submitting reviews,
 * user business creation (with 1-business per user limit), owner profile editing,
 * dynamic review distribution calculation, and public recent reviews.
 */
class BusinessController extends Controller
{
    /**
     * Compute dynamic star rating distribution and counts for a business.
     */
    private function computeRatingStats($business)
    {
        $reviews = $business->reviews->where('status', 'published');
        $total = $reviews->count();

        $c5 = $reviews->where('rating', 5)->count();
        $c4 = $reviews->where('rating', 4)->count();
        $c3 = $reviews->where('rating', 3)->count();
        $c2 = $reviews->where('rating', 2)->count();
        $c1 = $reviews->where('rating', 1)->count();

        $ratingCounts = [
            'star5' => $c5,
            'star4' => $c4,
            'star3' => $c3,
            'star2' => $c2,
            'star1' => $c1,
        ];

        if ($total > 0) {
            $distribution = [
                round(($c5 / $total) * 100, 1),
                round(($c4 / $total) * 100, 1),
                round(($c3 / $total) * 100, 1),
                round(($c2 / $total) * 100, 1),
                round(($c1 / $total) * 100, 1),
            ];
        } else {
            $distribution = [0, 0, 0, 0, 0];
        }

        return [
            'ratingCounts' => $ratingCounts,
            'distribution' => $distribution,
        ];
    }

    /**
     * Format a Business Eloquent model into API response array.
     */
    private function formatBusiness($b, bool $includeReviews = true)
    {
        $stats = $includeReviews ? $this->computeRatingStats($b) : ['ratingCounts'=>['star5'=>0,'star4'=>0,'star3'=>0,'star2'=>0,'star1'=>0],'distribution'=>[0,0,0,0,0]];

        return [
            'id' => $b->id,
            'slug' => $b->slug,
            'name' => $b->name,
            'bengaliName' => $b->bengali_name,
            'category' => $b->category,
            'description' => $b->description,
            'location' => $b->location,
            'presence' => $b->presence,
            'googlePlaceId' => $b->google_place_id,
            'sourceUrl'=>$b->source_url,'sourceFetchedAt'=>$b->source_fetched_at,'latitude'=>$b->latitude,'longitude'=>$b->longitude,
            'operatingStatus'=>$b->operating_status,
            'rating' => round(($includeReviews ? $b->reviews->where('status', 'published')->avg('rating') : $b->published_review_rating) ?? 0, 1),
            'reviewCount' => $includeReviews ? $b->reviews->where('status', 'published')->count() : (int)$b->published_review_count,
            'verified' => (bool) $b->verified,
            'phone' => $b->phone,
            'website' => $b->website,
            'facebookUrl' => $b->facebook_url,
            'image' => $b->image ?: (\App\Models\BusinessProfileImage::where('business_id', $b->id)->where('status', 'approved')->exists() ? '/api/businesses/' . $b->id . '/profile-image' : null),
            'branches' => $b->branches ?: [],
            'userId' => $b->user_id,
            'createdByUserId' => $b->created_by_user_id,
            'status' => $b->status ?: 'approved',
            'is_demo' => (bool) $b->is_demo,
            'ratingCounts' => $stats['ratingCounts'],
            'distribution' => $stats['distribution'],
            'reviews' => $includeReviews ? $b->reviews->where('status', 'published')->values()
                ->map(fn ($review) => \App\Support\PublicReview::serialize($review)) : [],
        ];
    }

    /**
     * Search and list approved businesses from database.
     */
    public function index(Request $request)
    {
        $request->validate(['id' => ['sometimes', 'integer', 'min:1']]);
        $query = Business::publicDirectory()->withCount(['reviews as published_review_count'=>fn($q)=>$q->where('status','published')])->withAvg(['reviews as published_review_rating'=>fn($q)=>$q->where('status','published')],'rating');
        if ($request->filled('id')) $query->whereKey((int) $request->input('id'));

        // Search text matching
        if ($request->has('q') && !empty(trim($request->input('q')))) {
            foreach(array_slice(preg_split('/\s+/u',mb_strtolower(trim($request->input('q')))),0,12) as $keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(bengali_name) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(category) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(location) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%{$keyword}%"]);
            });
            }
        }

        // Match meaningful address components before pagination and counting.
        $request->validate(['location'=>'nullable|string|max:255','claimable'=>'nullable|boolean']);
        if ($request->boolean('claimable')) {
            $query->whereNull('user_id')->where('verified', false);
        }
        \App\Support\DirectoryAreaFilter::apply($query, $request->input('location', ''));

        // Filter by Category
        if ($request->has('category') && $request->input('category') !== 'All' && $request->input('category') !== 'All Categories') {
            $cat = $request->input('category');
            $query->where('category', 'LIKE', "%{$cat}%");
        }

        // Filter by Minimum Rating
        if ($request->has('min_rating') && is_numeric($request->input('min_rating'))) {
            $minRating = (float) $request->input('min_rating');
            if ($minRating > 0) {
                $query->whereRaw('CAST((SELECT AVG(rating) FROM reviews WHERE business_id = businesses.id AND status = ?) AS DECIMAL(10,2)) >= ?', ['published', $minRating]);
            }
        }

        $request->validate(['limit'=>'nullable|integer|min:1|max:50','page'=>'nullable|integer|min:1','q'=>'nullable|string|max:255']);
        $limit=(int)$request->input('limit',50);$page=(int)$request->input('page',1);
        $total=(clone $query)->count();
        $query->orderBy('id')->offset(($page-1)*$limit)->limit($limit);
        $businesses = $query->get();
        $formatted = $businesses->map(fn ($b) => $this->formatBusiness($b, false));

        return response()->json([
            'success' => true,
            'count' => $formatted->count(),
            'total'=>$total,'page'=>$page,'last_page'=>max(1,(int)ceil($total/$limit)),
            'imported_count'=>Business::whereNotNull('source_ref')->count(),
            'data' => $formatted,
        ]);
    }

    /**
     * Get single business detail by slug.
     */
    public function show($slug)
    {
        $merged = Business::where(function ($q) use ($slug) {
            $q->where('slug', $slug);
            if (is_numeric($slug)) $q->orWhere('id', (int) $slug);
        })->whereNotNull('merged_into_id')->first();
        if ($merged) { $target=Business::findOrFail($merged->merged_into_id); return $this->show($target->slug); }
        $business = Business::with(['reviews' => fn ($q) => $q->withPublicDiscussionCount()])
            ->where(function ($q) use ($slug) {
                $q->where('slug', $slug);
                if (is_numeric($slug)) $q->orWhere('id', (int) $slug);
            })
            ->whereIn('status', ['approved', 'pending'])->first();

        if (!$business) {
            return response()->json([
                'success' => false,
                'message' => 'Business entity not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatBusiness($business),
        ]);
    }

    /**
     * Get recent community reviews for homepage.
     */
    public function recentReviews()
    {
        $reviews = Review::with('business')->withPublicDiscussionCount()
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')->orderBy('id', 'desc')
            ->take(6)
            ->get()
            ->map(fn ($review) => \App\Support\PublicReview::serialize($review, true));

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    /**
     * Create a new business account request.
     * Enforces: One account can only create ONE business account.
     * Saved with status = 'pending' until Admin approves.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Sign in before adding an entity.'], 401);
        }

        $validated = $request->validate(\App\Support\OrganizationProfileImage::rules()+\App\Support\AdministrativeLocation::rules()+[
            'name' => 'required|string|max:255',
            'bengali_name' => 'nullable|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'facebook_url' => 'nullable|url|max:255',
        ]);

        $mapData=$request->validate(['presence'=>'nullable|in:physical,online,both','google_place_id'=>'nullable|string|max:255']);
        $validated['location']=\App\Support\AdministrativeLocation::normalize($request,$validated['location']??null,$mapData['presence']??null);
        if(in_array($mapData['presence']??null,['physical','both'],true) && !trim($validated['location']??'')) throw \Illuminate\Validation\ValidationException::withMessages(['location'=>'A physical organization requires an address.']);
        if(($mapData['presence']??null)==='online') $mapData['google_place_id']=null;
        if(!empty($mapData['google_place_id'])) {
            $existing=Business::where('google_place_id',$mapData['google_place_id'])->whereIn('status',['pending','approved'])->first();
            if($existing) return response()->json(['message'=>'This Maps place already has a profile. Select the existing business instead.','existing_slug'=>$existing->slug],409);
        }
        $baseSlug = Str::slug($validated['name']) ?: 'entity-'.Str::lower(Str::random(10));
        $same=Business::whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($validated['name']))])->whereRaw('LOWER(TRIM(COALESCE(location,\'\'))) = ?', [mb_strtolower(trim($validated['location']??''))])->whereIn('status',['pending','approved'])->first();
        if($same)return response()->json(['message'=>'This name and location already have a listing. Use the existing entity.','existing_slug'=>$same->slug],409);
        $slug = $baseSlug;
        $count = 1;

        while (Business::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $count;
            $count++;
        }

        $storedImagePath = null;
        $profileImage = null;
        try {
        $business = \DB::transaction(function () use ($request, $user, $validated, $mapData, $slug, &$storedImagePath, &$profileImage) {
        $business = Business::create([
            'user_id' => null,
            'created_by_user_id' => $user->id,
            'presence' => $mapData['presence']??null,
            'google_place_id' => $mapData['google_place_id']??null,
            'status' => 'pending', // Pending approval by Admin
            'name' => $validated['name'],
            'bengali_name' => $validated['bengali_name'] ?? null,
            'slug' => $slug,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'location' => $validated['location'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'website' => $validated['website'] ?? null,
            'facebook_url' => $validated['facebook_url'] ?? null,
            'rating' => 0.0,
            'review_count' => 0,
            'verified' => false,
            'color' => '#0f766e',
        ]);
        $profileImage = \App\Support\OrganizationProfileImage::quarantine($request, $business, $storedImagePath);
        if ($request->filled('latitude') && $request->filled('longitude')) {
            $lat = (float) $request->input('latitude');
            $lng = (float) $request->input('longitude');
            $business->latitude = $lat;
            $business->longitude = $lng;
            $business->save();

            $pointWkt = sprintf('POINT(%F %F)', $lng, $lat);
            $entityLoc = \App\Models\EntityLocation::updateOrCreate(
                ['entity_id' => $business->id],
                [
                    'division_id' => $request->input('division_id'),
                    'district_id' => $request->input('district_id'),
                    'upazila_id' => $request->input('upazila_id'),
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'road' => $request->input('road'),
                    'area' => $request->input('area'),
                    'postcode' => $request->input('postcode'),
                    'detected_address' => $request->input('detected_address'),
                    'confirmed_address' => $business->location,
                    'accuracy_level' => 'resolved',
                    'user_confirmed' => true,
                ]
            );
            \DB::statement(
                'UPDATE entity_locations SET location = ST_SRID(ST_GeomFromText(?), 4326) WHERE id = ?',
                [$pointWkt, $entityLoc->id]
            );
        }
        return $business;
        });
        } catch (\Throwable $error) {
            if ($storedImagePath) \Illuminate\Support\Facades\Storage::disk('private')->delete($storedImagePath);
            throw $error;
        }

        return response()->json([
            'success' => true,
            'message' => 'Community entity created. You may review it immediately while moderators check its details.',
            'data' => $this->formatBusiness($business) + ['profileImageStatus' => $profileImage ? 'pending' : null],
        ], 201);
    }

    /**
     * Update business profile facts & picture.
     * Enforces: Only the owner (who created it) can edit it.
     */
    public function update(Request $request, $id)
    {
        $business = Business::findOrFail($id);
        $user = $request->user();

        // Enforce ownership or staff check
        $isOwner = $user && $business->user_id && (int)$business->user_id === (int)$user->id && $business->verified;
        $isStaff = $user && in_array($user->role, ['admin', 'moderator'], true);

        if (!$user || (!$isOwner && !$isStaff)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. This business account can only be edited by the verified owner or staff.',
            ], 403);
        }

        $validated = $request->validate(\App\Support\OrganizationProfileImage::rules()+\App\Support\AdministrativeLocation::rules()+[
            'name' => 'sometimes|required|string|max:255',
            'bengali_name' => 'nullable|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'facebook_url' => 'nullable|url|max:255',
        ]);

        if($request->hasAny(['division_id','district_id','upazila_id'])) $validated['location']=\App\Support\AdministrativeLocation::normalize($request,$validated['location']??null,$business->presence);
        unset($validated['division_id'],$validated['district_id'],$validated['upazila_id'],$validated['file'],$validated['profile_image'],$validated['profile_image_consent']);
        $storedImagePath = null;
        $profileImage = null;
        try {
            \DB::transaction(function () use ($request, $business, &$validated, &$storedImagePath, &$profileImage) {
                $profileImage = \App\Support\OrganizationProfileImage::quarantine($request, $business, $storedImagePath);
                if ($profileImage) {
                    \App\Models\BusinessProfileImage::where('business_id', $business->id)->where('status', 'approved')->update(['status' => 'superseded']);
                    $profileImage->update(['status' => 'approved']);
                    $validated['image'] = '/api/businesses/' . $business->id . '/profile-image';
                    $business->image = '/api/businesses/' . $business->id . '/profile-image';
                }
                if(isset($validated['location']) && $validated['location'] !== $business->location) {$business->google_place_id=null;$business->latitude=null;$business->longitude=null;}
                $business->update(array_filter($validated, fn ($value) => $value !== null));
            });
        } catch (\Throwable $error) {
            if ($storedImagePath) \Illuminate\Support\Facades\Storage::disk('private')->delete($storedImagePath);
            throw $error;
        }

        return response()->json([
            'success' => true,
            'message' => 'Business profile updated successfully in the database!',
            'data' => $this->formatBusiness($business->fresh('reviews')) + ['profileImageStatus' => $profileImage ? 'approved' : null],
        ]);
    }

    /**
     * Submit a review for a business entity.
     * Enforces: Business owner CANNOT write a review on their own business account.
     */
    public function storeReview(Request $request, $id)
    {
        $business = Business::findOrFail($id);
        $user = $request->user();

        // Enforce rule: Owner cannot review their own business
        if ($user && $business->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Business owners are not permitted to post reviews on their own business account.',
            ], 403);
        }

        $validated = $request->validate(\App\Support\PublicVideoLinks::rules() + [
            'author' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'service_rating' => 'nullable|integer|min:1|max:5',
            'value_rating' => 'nullable|integer|min:1|max:5',
            'comm_rating' => 'nullable|integer|min:1|max:5',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'broadcast_requested' => 'sometimes|boolean',
            'request_scam_alert' => 'sometimes|boolean', // legacy compatibility
            'experience_date' => 'nullable|date|before_or_equal:today',
            'relationship_disclosure' => 'nullable|in:none,employee,competitor,incentive,family,other',
            'location' => 'nullable|string|max:255',
            'facebook_url' => 'nullable|url|max:255',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:5120',
            'evidence' => 'nullable|array|max:20',
            'evidence.*' => 'required|file|mimes:jpeg,png,jpg,webp,pdf|max:5120',
        ]);

        $files = $request->file('evidence', []);
        if ($request->hasFile('file')) $files[] = $request->file('file');
        abort_if(count($files) > 20, 422, 'Attach up to 20 files in total.');
        $storedPaths = [];
        try {
        $review = \DB::transaction(function () use ($files, &$storedPaths, $user, $business, $validated, $request) {
        $evidencePaths = [];
        foreach ($files as $file) {
            $path = $file->store('review-evidence', 'private');
            if (!$path) throw new \RuntimeException('Evidence could not be stored.');
            $storedPaths[] = $path;
            $evidencePaths[] = ['path' => $path, 'mime' => $file->getMimeType()];
        }
        $imagePath = $storedPaths ? 'private:' . $storedPaths[0] : null;

        $authorName = $user->name;
        $initials = strtoupper(substr($authorName, 0, 2));
        $broadcastRequested = $request->boolean('broadcast_requested');

        $review = Review::create([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'author' => $authorName,
            'initials' => $initials,
            'rating' => $validated['rating'],
            'service_rating' => $validated['service_rating'] ?? null,
            'value_rating' => $validated['value_rating'] ?? null,
            'comm_rating' => $validated['comm_rating'] ?? null,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'date' => date('Y-m-d'),
            'experience_date' => $validated['experience_date'] ?? null,
            'disclaimer' => 'Independent Customer Review',
            'relationship_disclosure' => $validated['relationship_disclosure'] ?? 'none',
            'status' => 'published', // Always published immediately
            'broadcast_requested' => $broadcastRequested,
            'verified_experience' => false,
            'location' => $validated['location'] ?? null,
            'facebook_url' => $validated['facebook_url'] ?? null,
            'image_path' => $imagePath,
            'evidence_paths' => $evidencePaths,
            'public_video_urls' => \App\Support\PublicVideoLinks::visible($validated['public_video_urls'] ?? []),
            'public_video_consent' => $request->boolean('public_video_consent'),
        ]);

        if ($broadcastRequested) {
            $staffIds = \DB::table('users')->whereIn('role', ['admin', 'moderator'])->pluck('id');
            foreach ($staffIds as $staffId) {
                \DB::table('notifications')->insert([
                    'user_id' => $staffId,
                    'type' => 'admin_review_broadcast_request',
                    'title' => 'Review Broadcast Request',
                    'body' => $user->name . ' requested a community broadcast for their review on ' . $business->name . '.',
                    'url' => '/reviews/' . $review->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        // Recalculate average rating and count
        $allReviews = $business->reviews()->where('status', 'published')->get();
        $avgRating = $allReviews->avg('rating');
        $business->update([
            'rating' => round($avgRating ?? 0, 1),
            'review_count' => $allReviews->count(),
        ]);
        return $review;
        });
        } catch (\Throwable $error) {
            \Illuminate\Support\Facades\Storage::disk('private')->delete($storedPaths);
            throw $error;
        }

        return response()->json([
            'success' => true,
            'message' => $review->broadcast_requested
                ? 'Review submitted and community broadcast requested from moderators!'
                : 'Review submitted successfully!',
            'data' => $review->toArray(),
        ], 201);
    }
}


