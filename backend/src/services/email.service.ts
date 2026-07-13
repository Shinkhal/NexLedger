import { getEnv } from "../config/env.config";
import { logger } from "../utils/logger.util";
import ResendConfig from "../config/resend.config";
import { buildWelcomeEmail } from "../emails/welcome.email";
import { buildResetPasswordEmail } from "../emails/reset-password.email";

export class EmailService {
  private constructor() {}

  static async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    if (!ResendConfig.isAvailable()) {
      logger.warn("Resend not initialized — email not sent");
      return;
    }

    try {
      const resend = ResendConfig.getInstance();
      const { data, error } = await resend.emails.send({
        from: getEnv.mail.from(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        logger.error("Failed to send email via Resend", { error });
        throw error;
      }

      logger.info(`Email sent: ${data?.id}`);
      return data;
    } catch (error) {
      logger.error("Failed to send email:", error);
      throw error;
    }
  }

  static async sendWelcomeEmail(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    const dashboardUrl = getEnv.client.url();
    const { html, text } = buildWelcomeEmail({ ...data, dashboardUrl });

    return this.sendMail({
      to: data.email,
      subject: "Welcome to NexLedger – Your Account Has Been Created",
      html,
      text,
    });
  }

  static async sendPasswordResetEmail(to: string, name: string, token: string) {
    const resetUrl = `${getEnv.client.url()}/reset-password?token=${token}`;
    const { html, text } = buildResetPasswordEmail({ name, resetUrl });

    return this.sendMail({
      to,
      subject: "Reset your password - NexLedger",
      html,
      text,
    });
  }
}
