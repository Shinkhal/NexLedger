interface ResetPasswordEmailData {
  name: string;
  resetUrl: string;
}

export function buildResetPasswordEmail(data: ResetPasswordEmailData): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:24px;font-weight:700;color:#111827;">NexLedger</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:12px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Reset Your Password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">Hi <strong style="color:#111827;">${data.name}</strong>, we received a password reset request for your NexLedger account.</p>
              <a href="${data.resetUrl}" style="display:block;text-align:center;padding:14px 24px;background-color:#4F46E5;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;margin-bottom:24px;">Reset Password</a>
              <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;line-height:1.5;">This link expires in <strong style="color:#6B7280;">1 hour</strong>. If you didn't request this reset, you can safely ignore this email.</p>
              <hr style="margin:24px 0;border:0;border-top:1px solid #E5E7EB;" />
              <p style="margin:0;font-size:12px;color:#9CA3AF;word-break:break-all;">Reset Link: ${data.resetUrl}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">NexLedger Finance Dashboard &bull; Built with Express + MongoDB</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${data.name},`,
    "",
    "We received a password reset request for your NexLedger account.",
    "",
    `Reset your password at: ${data.resetUrl}`,
    "",
    "This link expires in 1 hour.",
    "If you didn't request this reset, you can safely ignore this email.",
  ].join("\n");

  return { html, text };
}
