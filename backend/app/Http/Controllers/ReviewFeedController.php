<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Support\{DirectoryAreaFilter, PublicReview};
use Illuminate\Http\Request;

class ReviewFeedController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:255', 'category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255', 'page' => 'nullable|integer|min:1',
            'lang' => 'nullable|in:en,bn', 'sort' => 'nullable|in:newest,oldest']);
        $query = Review::with('business')->withPublicDiscussionCount()->where('status', 'published');
        if ($request->filled('q')) {
            foreach (array_slice(preg_split('/\s+/u', trim($request->input('q'))), 0, 12) as $keyword) {
                $query->where(function ($q) use ($keyword) {
                    $pattern = '%'.$keyword.'%';
                    $q->where('title', 'like', $pattern)->orWhere('body', 'like', $pattern)
                        ->orWhereHas('business', fn ($business) => $business->where('name', 'like', $pattern)->orWhere('bengali_name', 'like', $pattern));
                    foreach (['en', 'bn'] as $lang) {
                        $q->orWhere(function ($translated) use ($lang, $pattern) {
                            $translated->where('translations->'.$lang.'->approved_for_public', true)
                                ->where(fn ($text) => $text->where('translations->'.$lang.'->title', 'like', $pattern)->orWhere('translations->'.$lang.'->body', 'like', $pattern));
                        });
                    }
                });
            }
        }
        if ($request->filled('category') && !in_array($request->category, ['All', 'All Categories'], true)) {
            $query->whereHas('business', fn ($business) => $business->where('category', 'like', '%'.$request->category.'%'));
        }
        if ($request->filled('location')) $query->whereHas('business', fn ($business) => DirectoryAreaFilter::apply($business, $request->input('location')));
        $direction = $request->input('sort', 'newest') === 'oldest' ? 'asc' : 'desc';
        $page = $query->orderBy('created_at', $direction)->orderBy('id', $direction)->paginate(20);
        return response()->json(['success' => true, 'count' => $page->count(), 'total' => $page->total(),
            'page' => $page->currentPage(), 'last_page' => $page->lastPage(),
            'data' => $page->getCollection()->map(fn ($review) => PublicReview::serialize($review, true))]);
    }
}
