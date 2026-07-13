interface WelcomeEmailData {
  name: string;
  email: string;
  password: string;
  role: string;
  dashboardUrl: string;
}

export function buildWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
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
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Welcome to NexLedger</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">Hi <strong style="color:#111827;">${data.name}</strong>, your account has been created.</p>
              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Your Credentials</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#6B7280;width:80px;">Email</td>
                        <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:500;">${data.email}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#6B7280;width:80px;">Password</td>
                        <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:500;">${data.password}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#6B7280;width:80px;">Role</td>
                        <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:500;">${data.role}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <a href="${data.dashboardUrl}" style="display:block;text-align:center;padding:14px 24px;background-color:#4F46E5;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;margin-bottom:24px;">Go to Dashboard</a>
              <!-- Footer note -->
              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">For security, please change your password after your first login. If you didn't expect this email, please contact your administrator.</p>
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
    `Welcome to NexLedger, ${data.name}!`,
    "",
    "Your account has been created with the following credentials:",
    `  Email:    ${data.email}`,
    `  Password: ${data.password}`,
    `  Role:     ${data.role}`,
    "",
    `Sign in at: ${data.dashboardUrl}`,
    "",
    "For security, please change your password after your first login.",
    "If you didn't expect this email, please contact your administrator.",
  ].join("\n");

  return { html, text };
}
