import { Injectable, Logger } from "@nestjs/common";
import sgMail from "@sendgrid/mail";
import { AppConfig } from "src/core/configuration/app.config";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isConfigured: boolean;
  private readonly fromEmail: string;

  constructor(private readonly config: AppConfig) {
    if (config.sendgridApiKey && config.sendgridFromEmail) {
      sgMail.setApiKey(config.sendgridApiKey);
      this.fromEmail = config.sendgridFromEmail;
      this.isConfigured = true;
    } else {
      this.logger.warn(
        "SendGrid not configured, emails will be logged only",
      );
      this.fromEmail = "";
      this.isConfigured = false;
    }
  }

  /**
   * Send password reset email
   * @param email - recipient
   * @param resetLink - password reset URL
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const html = `
      <h2>Reset Your Password</h2>
      <p>You requested a password reset for your Robopipe Studio account.</p>
      <p>Click the link below to set a new password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;
    await this.send(email, "Reset Your Password - Robopipe Studio", html);
  }

  /**
   * Send organization invitation email
   * @param email - recipient
   * @param fullName - invitee display name
   * @param resetLink - set-password URL
   */
  async sendInvitationEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    const escapedName = this.escapeHtml(fullName);
    const html = `
      <h2>You've Been Invited to Robopipe Studio</h2>
      <p>Hi ${escapedName},</p>
      <p>You've been invited to join an organization on Robopipe Studio.</p>
      <p>Click the link below to set your password and get started:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 24 hours.</p>
    `;
    await this.send(
      email,
      "You've Been Invited to Robopipe Studio",
      html,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
      this.logger.log(`[DEV EMAIL] Body: ${html}`);
      return;
    }

    try {
      await sgMail.send({
        to,
        from: this.fromEmail,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
