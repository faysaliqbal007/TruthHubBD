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
        $reviews = $business->reviews;
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
    private function formatBusiness($b)
    {
        $stats = $this->computeRatingStats($b);

        return [
            'id' => $b->id,
            'slug' => $b->slug,
            'name' => $b->name,
            'bengaliName' => $b->bengali_name,
            'category' => $b->category,
            'description' => $b->description,
            'location' => $b->location,
            'rating' => (float) $b->rating,
            'reviewCount' => (int) $b->review_count,
            'verified' => (bool) $b->verified,
            'phone' => $b->phone,
            'website' => $b->website,
            'facebookUrl' => $b->facebook_url,
            'color' => $b->color ?: '#0f766e',
            'image' => $b->image,
            'branches' => $b->branches ?: [],
            'userId' => $b->user_id,
            'status' => $b->status ?: 'approved',
            'ratingCounts' => $stats['ratingCounts'],
            'distribution' => $stats['distribution'],
            'reviews' => $b->reviews->map(function ($r) {
                return [
                    'id' => $r->id,
                    'author' => $r->author,
                    'initials' => $r->initials ?: strtoupper(substr($r->author, 0, 2)),
                    'rating' => (int) $r->rating,
                    'title' => $r->title,
                    'body' => $r->body,
                    'date' => $r->date ?: date('Y-m-d'),
                    'disclaimer' => $r->disclaimer,
                    'verifiedExperience' => (bool) $r->verified_experience,
                    'location' => $r->location,
                    'facebookUrl' => $r->facebook_url,
                    'imagePath' => $r->image_path,
                    'helpfulCount' => (int) $r->helpful_count,
                    'discussionCount' => (int) $r->discussion_count,
                ];
            }),
        ];
    }

    /**
     * Search and list approved businesses from database.
     */
    public function index(Request $request)
    {
        $query = Business::with('reviews')->where(function ($q) {
            $q->where('status', 'approved')->orWhereNull('status');
        });

        // Search text matching
        if ($request->has('q') && !empty(trim($request->input('q')))) {
            $keyword = strtolower(trim($request->input('q')));
            $query->where(function ($q) use ($keyword) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(bengali_name) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(category) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(location) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%{$keyword}%"]);
            });
        }

        // Filter by Category
        if ($request->has('category') && $request->input('category') !== 'All' && $request->input('category') !== 'All Categories') {
            $cat = $request->input('category');
            $query->where('category', 'LIKE', "%{$cat}%");
        }

        // Filter by Minimum Rating
        if ($request->has('min_rating') && is_numeric($request->input('min_rating'))) {
            $minRating = (float) $request->input('min_rating');
            if ($minRating > 0) {
                $query->where('rating', '>=', $minRating);
            }
        }

        $businesses = $query->get();
        $formatted = $businesses->map(fn ($b) => $this->formatBusiness($b));

        return response()->json([
            'success' => true,
            'count' => $formatted->count(),
            'data' => $formatted,
        ]);
    }

    /**
     * Get single business detail by slug.
     */
    public function show($slug)
    {
        $business = Business::with('reviews')->where('slug', $slug)->first();

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
        $reviews = Review::with('business')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'author' => $r->author,
                    'initials' => $r->initials ?: strtoupper(substr($r->author, 0, 2)),
                    'rating' => (int) $r->rating,
                    'title' => $r->title,
                    'body' => $r->body,
                    'date' => $r->date ?: date('Y-m-d'),
                    'businessName' => $r->business ? $r->business->name : 'Business Entity',
                    'businessSlug' => $r->business ? $r->business->slug : '',
                ];
            });

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

        // Enforce 1 business account per user limit
        if ($user) {
            $existing = Business::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already created or submitted a business account. Each user account is allowed only one business entity.',
                ], 422);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bengali_name' => 'nullable|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'facebook_url' => 'nullable|url|max:255',
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $count = 1;

        while (Business::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $count;
            $count++;
        }

        $business = Business::create([
            'user_id' => $user ? $user->id : null,
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

        return response()->json([
            'success' => true,
            'message' => 'Business account creation request submitted successfully! It is pending approval from the Admin.',
            'data' => $this->formatBusiness($business),
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

        // Enforce ownership check
        if (!$user || $business->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. This business account can only be edited by the user who created it.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'bengali_name' => 'nullable|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'facebook_url' => 'nullable|url|max:255',
            'image' => 'nullable|string',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Handle image upload if present
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $uploadedFile = $request->file('file');
            $fileName = time() . '_' . Str::random(10) . '.' . $uploadedFile->getClientOriginalExtension();
            $uploadedFile->move(public_path('uploads/businesses'), $fileName);
            $validated['image'] = '/uploads/businesses/' . $fileName;
        }

        $business->update(array_filter($validated, fn ($value) => $value !== null));

        return response()->json([
            'success' => true,
            'message' => 'Business profile updated successfully in the database!',
            'data' => $this->formatBusiness($business->fresh('reviews')),
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

        $validated = $request->validate([
            'author' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'service_rating' => 'nullable|integer|min:1|max:5',
            'value_rating' => 'nullable|integer|min:1|max:5',
            'comm_rating' => 'nullable|integer|min:1|max:5',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'location' => 'nullable|string|max:255',
            'facebook_url' => 'nullable|url|max:255',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,pdf|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $uploadedFile = $request->file('file');
            $fileName = time() . '_' . Str::random(10) . '.' . $uploadedFile->getClientOriginalExtension();
            $uploadedFile->move(public_path('uploads/reviews'), $fileName);
            $imagePath = '/uploads/reviews/' . $fileName;
        }

        $authorName = $validated['author'] ?? ($user ? $user->name : 'Anonymous User');
        $initials = strtoupper(substr($authorName, 0, 2));

        $review = Review::create([
            'business_id' => $business->id,
            'author' => $authorName,
            'initials' => $initials,
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'body' => $validated['body'],
            'date' => date('Y-m-d'),
            'disclaimer' => 'Independent Customer Review',
            'verified_experience' => true,
            'location' => $validated['location'] ?? null,
            'facebook_url' => $validated['facebook_url'] ?? null,
            'image_path' => $imagePath,
        ]);

        // Recalculate average rating and count
        $allReviews = $business->reviews()->get();
        $avgRating = $allReviews->avg('rating');
        $business->update([
            'rating' => round($avgRating, 1),
            'review_count' => $allReviews->count(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully!',
            'data' => $review,
        ], 201);
    }
}


