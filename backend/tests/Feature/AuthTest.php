<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'test@example.com')
            ->assertJsonPath('user.role', 'user');

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'user',
        ]);
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Another User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'login@example.com');

        $this->assertAuthenticated();
    }

    public function test_invalid_password_fails(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_endpoint_works(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_unauthenticated_user_endpoint_returns_unauthorized(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertUnauthorized();
    }

    public function test_logout_invalidates_access(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/logout')->assertOk();

        $this->assertGuest();
    }

    public function test_user_cannot_update_another_users_profile(): void
    {
        $user = User::factory()->create(['name' => 'Original']);
        $other = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/profile', [
            'name' => 'Updated Name',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $other->id,
            'name' => $other->name,
        ]);
    }
}
