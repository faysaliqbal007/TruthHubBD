<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReviewImageExposureTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_review_with_uploaded_photo_exposes_image_path_and_serves_image(): void
    {
        Storage::fake('private');
        $user = User::factory()->create();
        $business = Business::create(['name' => 'Tasty Cafe', 'slug' => 'tasty-cafe', 'category' => 'Restaurants', 'status' => 'approved']);

        $imageFile = UploadedFile::fake()->createWithContent('food.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='));

        $response = $this->actingAs($user)->post('/api/businesses/' . $business->id . '/reviews', [
            'rating' => 5,
            'title' => 'Delicious food and great service',
            'body' => 'I loved the burger and fries. Here is a photo of our table.',
            'evidence' => [$imageFile],
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $reviewId = $response->json('data.id');
        $this->assertNotNull($reviewId);

        // Check review in business details
        $bizRes = $this->getJson('/api/businesses/tasty-cafe');
        $bizRes->assertOk();
        $this->assertNotNull($bizRes->json('data.reviews.0.imagePath'));
        $this->assertStringContainsString('/api/reviews/' . $reviewId . '/image', $bizRes->json('data.reviews.0.imagePath'));
        $this->assertNotEmpty($bizRes->json('data.reviews.0.images'));

        // Check review detail endpoint
        $detailRes = $this->getJson('/api/reviews/' . $reviewId);
        $detailRes->assertOk();
        $this->assertNotNull($detailRes->json('data.imagePath'));
        $this->assertNotEmpty($detailRes->json('data.images'));

        // Verify the image proxy endpoint returns the file
        $imgRes = $this->get('/api/reviews/' . $reviewId . '/image');
        $imgRes->assertOk();
        $this->assertStringStartsWith('image/', $imgRes->headers->get('Content-Type'));
    }
}
