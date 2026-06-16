import { Injectable, Logger } from "@nestjs/common";
import sgMail from "@sendgrid/mail";
import { OrgMemberRoleEnum } from "@repo/schema";
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
   * @param email - recipient
   * @param fullName - user's display name
   * @param setPasswordLink - URL to the set-password page
   */
  async sendWelcomeEmail(email: string, fullName: string, setPasswordLink: string): Promise<void> {
    const html = `
      <h2>Welcome to Robopipe Studio</h2>
      <p>Hi ${fullName},</p>
      <p>Your account has been created. To get started, set your password by clicking the link below:</p>
      <p><a href="${setPasswordLink}">${setPasswordLink}</a></p>
      <p>This link will expire in 24 hours.</p>
    `;
    await this.send(email, "Welcome to Robopipe Studio — Set Your Password", html);
  }

  /**
   * Send organization invitation email
   * @param email - recipient
   * @param organizationName - name of the inviting org
   * @param inviteLink - invitation acceptance URL
   */
  async sendInvitationEmail(
    email: string,
    organizationName: string,
    inviteLink: string,
    role: OrgMemberRoleEnum,
  ): Promise<void> {
    const roleLabel = role === OrgMemberRoleEnum.ADMIN ? 'Admin' : 'Member';
    const html = `
      <h2>You've Been Invited to Robopipe Studio</h2>
      <p>You've been invited to join <strong>${organizationName}</strong> on Robopipe Studio as a <strong>${roleLabel}</strong>.</p>
      <p>Click the link below to accept the invitation:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>This invitation will expire in 7 days.</p>
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

}
