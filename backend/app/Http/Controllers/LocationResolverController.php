<?php

namespace App\Http\Controllers;

use App\Services\LocationResolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationResolverController extends Controller
{
    public function resolve(Request $request, LocationResolverService $service): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $result = $service->resolve(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        return response()->json($result);
    }

    public function search(Request $request, LocationResolverService $service): JsonResponse
    {
        $q = (string) $request->input('q', '');
        $results = $service->search($q);
        return response()->json(['success' => true, 'data' => $results]);
    }
}
