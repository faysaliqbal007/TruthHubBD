<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class PasswordResetWithCodeNotification extends Notification
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
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $resetUrl = $frontendUrl . '/reset-password?email=' . urlencode($notifiable->email) . '&code=' . urlencode($this->code);

        $logoPath = public_path('images/logo.png');
        if (!file_exists($logoPath)) {
            $logoPath = base_path('../assets/logo.png');
        }

        return (new MailMessage)
            ->subject("TruthHubBD Password Reset Code: {$this->code}")
            ->view('emails.password_reset', [
                'notifiable' => $notifiable,
                'code' => $this->code,
                'resetUrl' => $resetUrl,
                'frontendUrl' => $frontendUrl,
                'logoPath' => file_exists($logoPath) ? $logoPath : null,
            ]);
    }
}
