<?php

namespace Tests\Feature;

use App\Models\{Business, BusinessProfileImage, User};
use App\Services\MalwareScanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{DB, Process, Storage};
use Tests\TestCase;

class OrganizationProfileImageTest extends TestCase
{
    use RefreshDatabase;
    private array $privateFilesBefore = [];

    private function png(): string
    {
        return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=');
    }

    private function fields(): array
    {
        return ['name' => 'Fictional Photo Organization', 'category' => 'Products', 'presence' => 'online', 'website' => 'https://example.test'];
    }

    private function upload(): array
    {
        return $this->fields() + ['profile_image' => UploadedFile::fake()->createWithContent('fictional-logo.png', $this->png()), 'profile_image_consent' => '1'];
    }

    private function privateStorage(): void
    {
        Storage::fake('private');
        Storage::fake('public');
        // Windows can retain an unrelated locked download fixture. Assert that
        // this request adds no files, including on a transaction failure.
        $this->privateFilesBefore = Storage::disk('private')->allFiles();
    }

    private function submitImage(): BusinessProfileImage
    {
        $this->actingAs(User::factory()->create())->post('/api/businesses', $this->upload(), ['Accept' => 'application/json'])->assertCreated();
        return BusinessProfileImage::firstOrFail();
    }

    public function test_no_image_json_submission_remains_backward_compatible_and_unclaimed(): void
    {
        $this->privateStorage();
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/businesses', $this->fields() + ['image' => '/storage/review-evidence/private.png', 'verified' => true, 'user_id' => $user->id])
            ->assertCreated()->assertJsonPath('data.image', null)->assertJsonPath('data.profileImageStatus', null)->assertJsonPath('data.verified', false)->assertJsonPath('data.userId', null);
        $this->assertDatabaseCount('business_profile_images', 0);
        $this->assertSame($this->privateFilesBefore, Storage::disk('private')->allFiles());
        $this->assertDatabaseHas('businesses', ['created_by_user_id' => $user->id, 'status' => 'pending']);
    }

    public function test_image_is_scanned_and_quarantined_and_public_directory_exposes_no_private_paths(): void
    {
        $this->privateStorage();
        $response = $this->actingAs(User::factory()->create())->post('/api/businesses', $this->upload(), ['Accept' => 'application/json']);
        $response->assertCreated()->assertJsonPath('data.profileImageStatus', 'pending')->assertJsonPath('data.image', null)->assertJsonPath('data.userId', null)->assertJsonPath('data.verified', false);
        $image = BusinessProfileImage::firstOrFail();
        Storage::disk('private')->assertExists($image->storage_path);
        $this->assertSame([], Storage::disk('public')->allFiles());
        $this->assertDatabaseHas('audit_logs', ['action' => 'upload.scan_passed']);
        $this->getJson('/api/businesses/'.$image->business->slug)->assertOk()->assertDontSee($image->storage_path)->assertDontSee('sha256')->assertJsonPath('data.image', null);
        $this->getJson('/api/businesses')->assertOk()->assertDontSee('organization-profile-images')->assertDontSee($image->storage_path);
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertNotFound();
        $this->assertArrayNotHasKey('storage_path', $image->toArray());
        $this->assertArrayNotHasKey('sha256', $image->toArray());
    }

    public function test_guest_cannot_upload_or_access_staff_preview_or_queue(): void
    {
        $this->privateStorage();
        $this->post('/api/businesses', $this->upload(), ['Accept' => 'application/json'])->assertUnauthorized();
        $this->getJson('/api/admin/organization-images')->assertUnauthorized();
        $this->getJson('/api/admin/organization-images/1/preview')->assertUnauthorized();
        $this->assertDatabaseCount('businesses', 0);
        $this->assertSame($this->privateFilesBefore, Storage::disk('private')->allFiles());
    }

    public function test_upload_permission_is_required_and_rolls_back_the_new_listing(): void
    {
        $this->privateStorage();
        $payload = $this->upload(); unset($payload['profile_image_consent']);
        $this->actingAs(User::factory()->create())->post('/api/businesses', $payload, ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('profile_image_consent');
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_profile_images', 0);
        $this->assertSame($this->privateFilesBefore, Storage::disk('private')->allFiles());
    }

    public function test_svg_spoofed_and_oversized_images_are_rejected_without_stored_records(): void
    {
        $this->privateStorage();
        $this->actingAs(User::factory()->create());
        $files = [
            UploadedFile::fake()->createWithContent('active.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
            UploadedFile::fake()->createWithContent('pretend.png', '<?php echo "not an image";'),
            UploadedFile::fake()->createWithContent('too-large.png', $this->png().str_repeat("\0", 5 * 1024 * 1024)),
        ];
        foreach ($files as $file) {
            $this->post('/api/businesses', $this->fields() + ['profile_image' => $file, 'profile_image_consent' => '1'], ['Accept' => 'application/json'])->assertUnprocessable();
        }
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_profile_images', 0);
        $this->assertSame($this->privateFilesBefore, Storage::disk('private')->allFiles());
    }

    public function test_infected_or_unavailable_scanner_fails_closed_before_creating_listing(): void
    {
        $this->privateStorage();
        $this->actingAs(User::factory()->create());
        $this->app->instance(MalwareScanner::class, new MalwareScanner);
        foreach ([1 => 422, 2 => 503] as $exit => $status) {
            Process::fake(['*' => Process::result(exitCode: $exit)]);
            $this->post('/api/businesses', $this->upload(), ['Accept' => 'application/json'])->assertStatus($status);
        }
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_profile_images', 0);
        $this->assertSame($this->privateFilesBefore, Storage::disk('private')->allFiles());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_jpeg_exif_and_png_exif_text_chunks_are_rejected_with_a_reexport_instruction(): void
    {
        $this->privateStorage();
        $this->actingAs(User::factory()->create());
        $jpeg = base64_decode('/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpAB//Z');
        $clean = $this->fields(); $clean['name'] = 'Fictional Clean JPEG';
        $this->post('/api/businesses', $clean + ['profile_image' => UploadedFile::fake()->createWithContent('clean.jpg', $jpeg), 'profile_image_consent' => '1'], ['Accept' => 'application/json'])->assertCreated();
        $metadata = "Exif\0\0GPS location private";
        $withExif = substr($jpeg, 0, 2)."\xff\xe1".pack('n', strlen($metadata) + 2).$metadata.substr($jpeg, 2);
        $files = [UploadedFile::fake()->createWithContent('camera.jpg', $withExif)];
        foreach (['eXIf', 'tEXt', 'zTXt', 'iTXt', 'foOb'] as $type) {
            $value = 'GPS location private';
            $chunk = pack('N', strlen($value)).$type.$value.pack('N', crc32($type.$value));
            $files[] = UploadedFile::fake()->createWithContent($type.'.png', substr($this->png(), 0, 33).$chunk.substr($this->png(), 33));
        }
        $before = Storage::disk('private')->allFiles();
        foreach ($files as $file) {
            $this->post('/api/businesses', $this->fields() + ['profile_image' => $file, 'profile_image_consent' => '1'], ['Accept' => 'application/json'])
                ->assertUnprocessable()->assertJsonValidationErrors('profile_image')->assertSee('Export a fresh');
        }
        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('business_profile_images', 1);
        $this->assertSame($before, Storage::disk('private')->allFiles());
    }

    public function test_storage_is_cleaned_if_image_record_creation_fails(): void
    {
        $this->privateStorage();
        $this->withoutExceptionHandling();
        BusinessProfileImage::creating(fn () => throw new \RuntimeException('Deliberate image record failure'));
        try {
            $this->actingAs(User::factory()->create())->post('/api/businesses', $this->upload(), ['Accept' => 'application/json']);
            $this->fail('Expected a persistence failure.');
        } catch (\RuntimeException $error) {
            $this->assertSame('Deliberate image record failure', $error->getMessage());
        } finally {
            BusinessProfileImage::flushEventListeners();
        }
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_profile_images', 0);
        $this->assertSame($this->privateFilesBefore, Storage::disk('private')->allFiles());
    }

    public function test_webp_without_metadata_is_accepted_and_exif_chunk_is_rejected(): void
    {
        $this->privateStorage();
        $this->actingAs(User::factory()->create());
        $webp = base64_decode('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vz0AAA=');
        $fields = $this->fields(); $fields['name'] = 'Fictional Clean WebP';
        $this->post('/api/businesses', $fields + ['profile_image' => UploadedFile::fake()->createWithContent('clean.webp', $webp), 'profile_image_consent' => '1'], ['Accept' => 'application/json'])->assertCreated();
        $value = 'GPS location private';
        $chunk = 'EXIF'.pack('V', strlen($value)).$value.(strlen($value) % 2 ? "\0" : '');
        $withExif = 'RIFF'.pack('V', strlen($webp) + strlen($chunk) - 8).substr($webp, 8).$chunk;
        $this->post('/api/businesses', $this->fields() + ['profile_image' => UploadedFile::fake()->createWithContent('camera.webp', $withExif), 'profile_image_consent' => '1'], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('profile_image')->assertSee('Export a fresh');
        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('business_profile_images', 1);
    }

    public function test_only_admin_can_approve_with_explicit_attestation_and_an_audit_reason(): void
    {
        $this->privateStorage();
        $image = $this->submitImage();
        $decision = ['status' => 'approved', 'reason' => 'Fictional fixture checked for permitted public display.', 'public_display_confirmed' => true];
        $this->getJson('/api/admin/organization-images/'.$image->id.'/preview')->assertForbidden();
        $this->patchJson('/api/admin/organization-images/'.$image->id, $decision)->assertForbidden();
        $moderator = User::factory()->create(['role' => 'moderator']);
        $this->actingAs($moderator)->getJson('/api/admin/organization-images')->assertOk()->assertJsonPath('data.0.id', $image->id)->assertDontSee($image->storage_path);
        $this->get('/api/admin/organization-images/'.$image->id.'/preview')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->patchJson('/api/admin/organization-images/'.$image->id, $decision)->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->patchJson('/api/admin/organization-images/'.$image->id, ['status' => 'approved', 'reason' => 'Fictional fixture reviewed.'])->assertUnprocessable();
        $this->patchJson('/api/admin/organization-images/'.$image->id, $decision)->assertOk();
        $this->assertDatabaseHas('businesses', ['id' => $image->business_id, 'image' => '/api/businesses/'.$image->business_id.'/profile-image', 'user_id' => null, 'verified' => false, 'status' => 'pending']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'organization_image.approved', 'actor_user_id' => $admin->id]);
        $this->app['auth']->forgetGuards();
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertOk()->assertHeader('Content-Type', 'image/png')->assertHeader('X-Content-Type-Options', 'nosniff')->assertContent($this->png());
    }

    public function test_approved_image_can_be_withdrawn_without_scan_and_cannot_be_republished(): void
    {
        $this->privateStorage();
        $image=$this->submitImage();
        $admin=User::factory()->create(['role'=>'admin']);
        $url='/api/admin/organization-images/'.$image->id;
        $this->actingAs($admin)->patchJson($url,['status'=>'approved','reason'=>'Fixture consent and image reviewed.','public_display_confirmed'=>true])->assertOk();
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertOk();
        $this->getJson('/api/admin/organization-images?status=approved&per_page=1')->assertOk()->assertJsonPath('data.0.status','approved')->assertJsonPath('pagination.total',1)->assertDontSee($image->storage_path);
        $this->mock(MalwareScanner::class,fn($mock)=>$mock->shouldNotReceive('scan'));
        $this->actingAs(User::factory()->create(['role'=>'moderator']))->patchJson($url,['status'=>'revoked','reason'=>'Fixture consent withdrawn.'])->assertForbidden();
        $this->actingAs($admin)->patchJson($url,['status'=>'revoked','reason'=>'Fixture consent withdrawn.'])->assertOk();
        $this->assertDatabaseHas('business_profile_images',['id'=>$image->id,'status'=>'revoked','publication_consent'=>false]);
        $this->assertDatabaseHas('businesses',['id'=>$image->business_id,'image'=>null]);
        $this->assertDatabaseHas('audit_logs',['action'=>'organization_image.revoked','auditable_id'=>$image->id,'actor_user_id'=>$admin->id]);
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertNotFound();
        $this->patchJson($url,['status'=>'approved','reason'=>'Fixture delayed approval attempt.','public_display_confirmed'=>true])->assertConflict();
        $this->patchJson($url,['status'=>'revoked','reason'=>'Fixture duplicate withdrawal.'])->assertConflict();
        $this->assertTrue(Storage::disk('private')->exists($image->storage_path));
    }

    public function test_failed_scan_on_approval_or_preview_never_publishes_the_image(): void
    {
        $this->privateStorage();
        $image = $this->submitImage();
        $this->app->instance(MalwareScanner::class, new MalwareScanner);
        Process::fake(['*' => Process::result(exitCode: 2)]);
        $this->actingAs(User::factory()->create(['role' => 'admin']))->get('/api/admin/organization-images/'.$image->id.'/preview')->assertStatus(503);
        $this->patchJson('/api/admin/organization-images/'.$image->id, ['status' => 'approved', 'reason' => 'Fictional approval attempt.', 'public_display_confirmed' => true])->assertStatus(503);
        $this->assertDatabaseHas('business_profile_images', ['id' => $image->id, 'status' => 'pending']);
        $this->assertNull($image->business->fresh()->image);
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertNotFound();
    }

    public function test_rejection_leaves_photo_private_and_repeat_decisions_cannot_publish_it(): void
    {
        $this->privateStorage();
        $image = $this->submitImage();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->patchJson('/api/admin/organization-images/'.$image->id, ['status' => 'rejected', 'reason' => 'Fictional image does not identify the organization.'])->assertOk();
        $this->patchJson('/api/admin/organization-images/'.$image->id, ['status' => 'approved', 'reason' => 'Fictional second decision.', 'public_display_confirmed' => true])->assertStatus(409);
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertNotFound();
        $this->assertNull($image->business->fresh()->image);
    }

    public function test_owner_photo_update_is_approved_for_verified_organization(): void
    {
        $this->privateStorage();
        $owner = User::factory()->create();
        $business = Business::create(['name' => 'Fictional Source Organization', 'slug' => 'fictional-source-organization', 'category' => 'Products', 'user_id' => $owner->id, 'verified' => true, 'status' => 'approved', 'source_ref' => 'node/fictional', 'source_url' => 'https://example.test/source', 'image' => '/demo-media/legacy-public.jpg']);
        $this->actingAs($owner)->post('/api/businesses/'.$business->id, ['_method' => 'PATCH', 'file' => UploadedFile::fake()->createWithContent('replacement.png', $this->png()), 'profile_image_consent' => '1'], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.profileImageStatus', 'approved')->assertJsonPath('data.image', '/api/businesses/'.$business->id.'/profile-image');
        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'verified' => true, 'user_id' => $owner->id, 'source_ref' => 'node/fictional', 'source_url' => 'https://example.test/source']);
        $this->get('/api/businesses/'.$business->id.'/profile-image')->assertOk();
    }

    public function test_public_endpoint_rejects_private_evidence_paths_and_changed_bytes_even_in_a_forged_approved_record(): void
    {
        $this->privateStorage();
        $image = $this->submitImage();
        $image->update(['status' => 'approved']);
        Storage::disk('private')->put($image->storage_path, 'Changed after scan');
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertStatus(409);
        Storage::disk('private')->put('review-evidence/secret.png', $this->png());
        $image->update(['storage_path' => 'review-evidence/secret.png', 'sha256' => hash('sha256', $this->png())]);
        $this->get('/api/businesses/'.$image->business_id.'/profile-image')->assertNotFound();
    }

    public function test_physical_presence_still_requires_structured_location_when_adding_an_image(): void
    {
        $this->privateStorage();
        $payload = $this->upload(); $payload['presence'] = 'physical';
        $this->actingAs(User::factory()->create())->post('/api/businesses', $payload, ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_profile_images', 0);
    }

    public function test_real_world_png_with_presentation_chunks_is_accepted_and_approved_with_entity(): void
    {
        $this->privateStorage();
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        // Build a PNG with standard presentation chunks (sRGB, pHYs)
        $srgbChunk = pack('N', 1) . 'sRGB' . "\x00" . pack('N', crc32('sRGB' . "\x00"));
        $physChunk = pack('N', 9) . 'pHYs' . pack('NNc', 2835, 2835, 1) . pack('N', crc32('pHYs' . pack('NNc', 2835, 2835, 1)));
        $realPng = substr($this->png(), 0, 33) . $srgbChunk . $physChunk . substr($this->png(), 33);

        $response = $this->actingAs($user)->post('/api/businesses', $this->fields() + [
            'name' => 'Real PNG Entity',
            'profile_image' => UploadedFile::fake()->createWithContent('logo.png', $realPng),
            'profile_image_consent' => '1',
        ], ['Accept' => 'application/json'])->assertCreated();

        $bizId = $response->json('data.id');
        $this->assertDatabaseHas('business_profile_images', ['business_id' => $bizId, 'status' => 'pending']);

        // When admin approves the organization listing, the profile image is approved too
        $this->actingAs($admin)->postJson('/api/admin/businesses/' . $bizId . '/approve', [
            'reason' => 'Legitimate organization with valid logo photo.',
        ])->assertOk();

        $this->assertDatabaseHas('business_profile_images', ['business_id' => $bizId, 'status' => 'approved']);
        $this->assertDatabaseHas('businesses', ['id' => $bizId, 'image' => '/api/businesses/' . $bizId . '/profile-image', 'status' => 'approved']);
        $this->get('/api/businesses/' . $bizId . '/profile-image')->assertOk()->assertHeader('Content-Type', 'image/png');
    }

    public function test_staff_can_update_organization_profile_image(): void
    {
        $this->privateStorage();
        $admin = User::factory()->create(['role' => 'admin']);
        $business = Business::create(['name' => 'Staff Managed Business', 'slug' => 'staff-managed-biz', 'category' => 'Products', 'status' => 'approved']);

        $this->actingAs($admin)->post('/api/businesses/' . $business->id, [
            '_method' => 'PATCH',
            'file' => UploadedFile::fake()->createWithContent('admin-logo.png', $this->png()),
            'profile_image_consent' => '1',
        ], ['Accept' => 'application/json'])->assertOk()
          ->assertJsonPath('data.profileImageStatus', 'approved')
          ->assertJsonPath('data.image', '/api/businesses/' . $business->id . '/profile-image');

        $this->get('/api/businesses/' . $business->id . '/profile-image')->assertOk();
    }

    public function test_admin_can_edit_organization_with_base64_image_data_url(): void
    {
        $this->privateStorage();
        $admin = User::factory()->create(['role' => 'admin']);
        $business = Business::create(['name' => 'Data URL Business', 'slug' => 'data-url-biz', 'category' => 'Products', 'status' => 'approved']);

        $base64Image = 'data:image/png;base64,' . base64_encode($this->png());
        $this->actingAs($admin)->patchJson('/api/admin/businesses/' . $business->id . '/edit', [
            'name' => 'Updated Data URL Business',
            'image' => $base64Image,
        ])->assertOk();

        $business->refresh();
        $this->assertSame('/api/businesses/' . $business->id . '/profile-image', $business->image);
        $this->assertDatabaseHas('business_profile_images', [
            'business_id' => $business->id,
            'status' => 'approved',
        ]);
        $this->get('/api/businesses/' . $business->id . '/profile-image')->assertOk();
    }
}
