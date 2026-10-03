<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default Admin user
        \App\Models\User::updateOrCreate(
            ['email' => 'truthhubbd64@gmail.com'],
            [
                'name' => 'TruthHub Official Admin',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            BusinessSeeder::class,
        ]);
    }
}
