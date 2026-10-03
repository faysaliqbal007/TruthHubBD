<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'google_id',
        'role',
        'is_restricted',
        'restricted_reason',
        'claim_blocked',
        'claim_blocked_reason',
        'email_verified_at',
        'verification_code',
        'verification_code_expires_at',
    ];

    protected $hidden = [
        'two_factor_secret',
        'two_factor_last_step',
        'two_factor_recovery_hashes',
        'password',
        'remember_token',
        'google_id',
        'verification_code',
    ];

    protected function casts(): array
    {
        return [
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_hashes' => 'array',
            'two_factor_confirmed_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'verification_code_expires_at' => 'datetime',
            'is_restricted' => 'boolean',
            'claim_blocked' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Send email verification notification containing a 6-digit numeric code.
     */
    public function sendEmailVerificationNotification(): void
    {
        $code = sprintf('%06d', random_int(100000, 999999));

        $this->forceFill([
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        $this->notify(new \App\Notifications\EmailVerificationWithCodeNotification($code));
    }

    /**
     * Relationship: A user can own at most one business account.
     */
    public function business()
    {
        return $this->hasOne(Business::class);
    }
}
