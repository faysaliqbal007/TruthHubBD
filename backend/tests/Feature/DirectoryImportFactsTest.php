<?php

namespace Tests\Feature;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DirectoryImportFactsTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_keeps_recorded_address_division_tags_and_source_coordinates_without_guessing(): void
    {
        Http::preventStrayRequests();
        Http::fake(['https://overpass-api.de/api/interpreter' => Http::response(['elements' => [
            ['type' => 'node', 'id' => 123, 'lat' => 23.123456, 'lon' => 90.987654, 'tags' => ['name' => 'Source Entity', 'shop' => 'electronics', 'addr:street' => 'Recorded Road', 'addr:district' => 'Gazipur', 'addr:province' => 'Dhaka', 'addr:state' => 'Dhaka']],
            ['type' => 'way', 'id' => 456, 'center' => ['lat' => 24.12345, 'lon' => 91.54321], 'tags' => ['name' => 'Unknown Address Entity', 'shop' => 'clothes']],
        ]], 200)]);
        $this->artisan('directory:import-osm', ['--apply' => true, '--limit' => 2])->assertExitCode(0);
        $source = Business::where('source_ref', 'osm:node:123')->firstOrFail();
        $this->assertSame('Recorded Road, Gazipur, Dhaka, Bangladesh', $source->location);
        $this->assertEquals(23.123456, $source->latitude);
        $this->assertEquals(90.987654, $source->longitude);
        $this->assertSame('https://www.openstreetmap.org/node/123', $source->source_url);
        $this->assertFalse($source->verified);
        $this->assertNull($source->user_id);
        $unknown = Business::where('source_ref', 'osm:way:456')->firstOrFail();
        $this->assertSame('Bangladesh', $unknown->location);
        $this->assertEquals(24.12345, $unknown->latitude);
        $this->getJson('/api/community-overview')->assertJsonPath('data.totals.imported_listings', 2)
            ->assertJsonPath('data.unknown_location.imported_listings', 1);
        $this->assertDatabaseCount('reviews', 0);
        $this->assertDatabaseCount('scam_cases', 0);
    }

    public function test_invalid_source_references_and_missing_or_outside_bounds_coordinates_are_skipped(): void
    {
        Http::preventStrayRequests();
        Http::fake(['https://overpass-api.de/api/interpreter' => Http::response(['elements' => [
            ['type' => 'node', 'id' => 1, 'tags' => ['name' => 'Missing coordinates']],
            ['type' => 'node', 'id' => 2, 'lat' => 80, 'lon' => 90, 'tags' => ['name' => 'Outside bounds']],
            ['type' => 'invalid', 'id' => 3, 'lat' => 23, 'lon' => 90, 'tags' => ['name' => 'Invalid source type']],
            ['type' => 'node', 'id' => -4, 'lat' => 23, 'lon' => 90, 'tags' => ['name' => 'Invalid source ID']],
        ]], 200)]);
        $this->artisan('directory:import-osm', ['--apply' => true, '--limit' => 4])->assertExitCode(0);
        $this->assertDatabaseCount('businesses', 0);
    }
}
