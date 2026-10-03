<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TruthHubBD Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">

          <!-- Top Civic Gradient Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #b91c1c 0%, #0f766e 50%, #0369a1 100%);"></td>
          </tr>

          <!-- Brand Header with Official Logo -->
          <tr>
            <td style="padding: 28px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    @if(!empty($logoPath) && file_exists($logoPath))
                      <img src="{{ $message->embed($logoPath) }}" alt="TruthHubBD" style="max-height: 48px; max-width: 220px; width: auto; height: auto; display: block; margin: 0 auto 8px;" />
                    @else
                      <div style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                        Truth<span style="color: #b91c1c;">Hub</span><span style="color: #0f766e;">BD</span>
                      </div>
                    @endif
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 4px;">
                      Civic Trust & Consumer Defense Platform
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Email Content -->
          <tr>
            <td style="padding: 32px 36px 28px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                Reset Your Password
              </h2>

              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 24px; color: #334155;">
                Hello <strong>{{ $notifiable->name ?? 'Valued Citizen' }}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14.5px; line-height: 23px; color: #475569;">
                We received a request to reset the password for your TruthHubBD account (<strong>{{ $notifiable->email }}</strong>). Use the verification code below to authorize your password change:
              </p>

              <!-- 6-Digit Code Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 20px 0;">
                <tr>
                  <td align="center" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px 20px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                      Your Password Reset Code
                    </div>
                    <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 8px; margin: 0; line-height: 1.2;">
                      {{ $code }}
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: #38bdf8;">
                      ⏱️ Valid for 15 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Direct Reset Button -->
              @if(!empty($resetUrl))
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ $resetUrl }}" target="_blank" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 13px 28px; font-size: 14px; font-weight: 700; border-radius: 8px; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">
                      Reset Password Directly &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              @endif

              <!-- Security Advice -->
              <div style="background-color: #f8fafc; border-left: 4px solid #0f766e; border-radius: 6px; padding: 14px 16px; margin: 24px 0 12px 0;">
                <p style="margin: 0; font-size: 12.5px; line-height: 19px; color: #475569;">
                  <strong>Security Note:</strong> Never share this code with anyone. TruthHubBD administrators will never ask for your password or verification code. If you did not request this, you can safely ignore this email; your account remains secure.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                TruthHubBD — Bangladesh Public Accountability & Scam Protection
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #64748b;">
                Sent from <a href="mailto:truthhubbd64@gmail.com" style="color: #0f766e; text-decoration: none;">truthhubbd64@gmail.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; {{ date('Y') }} TruthHubBD. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
