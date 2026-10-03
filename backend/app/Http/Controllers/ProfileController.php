<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * Controller handling user profile management.
 */
class ProfileController extends Controller
{
    /**
     * Update the authenticated user's profile information.
     */
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        if ($request->hasFile('avatar') && $request->file('avatar')->isValid()) {
            $file = $request->file('avatar');
            $dir = public_path('uploads' . DIRECTORY_SEPARATOR . 'avatars');
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            @chmod($dir, 0777);

            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $fileName = time() . '_' . Str::random(12) . '.' . $ext;
            $targetPath = $dir . DIRECTORY_SEPARATOR . $fileName;

            $saved = false;
            try {
                $file->move($dir, $fileName);
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
                if ($user->avatar_url && str_starts_with($user->avatar_url, '/uploads/avatars/')) {
                    $oldPath = public_path(ltrim($user->avatar_url, '/'));
                    if (file_exists($oldPath)) {
                        @unlink($oldPath);
                    }
                }
                $validated['avatar_url'] = '/uploads/avatars/' . $fileName;
            }
        }

        $user->update($validated);

        return response()->json([
            'user' => $user->fresh(),
        ]);
    }
}
