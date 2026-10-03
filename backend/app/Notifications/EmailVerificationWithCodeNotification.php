<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\HtmlString;

class EmailVerificationWithCodeNotification extends Notification
{
    use Queueable;

    public string $code;

    public function __construct(string $code)
    {
        $this->code = $code;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

        $logoPath = public_path('images/logo.png');
        if (!file_exists($logoPath)) {
            $logoPath = base_path('../assets/logo.png');
        }

        return (new MailMessage)
            ->subject("TruthHubBD Verification Code: {$this->code}")
            ->view('emails.verification_code', [
                'notifiable' => $notifiable,
                'code' => $this->code,
                'verificationUrl' => $verificationUrl,
                'frontendUrl' => $frontendUrl,
                'logoPath' => file_exists($logoPath) ? $logoPath : null,
            ]);
    }

    protected function verificationUrl($notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
