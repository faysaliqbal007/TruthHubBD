<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_returns_success_and_metadata(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'app',
                'database',
                'version',
                'commit',
                'deployed_at',
                'timestamp',
            ])
            ->assertJson([
                'app' => 'TruthHubBD',
            ]);
    }
}
