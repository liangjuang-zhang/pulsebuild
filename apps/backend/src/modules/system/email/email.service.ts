import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendRateLimiter } from '../../../common/throttling';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sgMail = require('@sendgrid/mail') as {
  setApiKey(apiKey: string): void;
  send(data: Record<string, unknown>): Promise<unknown>;
};

export interface EmailDetails {
  projectName?: string;
  location?: string;
  eventTime?: string;
  participants?: string[];
}

export interface EmailAttachment {
  filename: string;
  contentBase64: string;
  type?: string;
  disposition?: 'attachment' | 'inline';
}

export interface EmailOptions {
  attachments?: EmailAttachment[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isEnabled: boolean;
  private readonly fromEmail: string | null;
  private readonly isDevelopment: boolean;

  /** 每个邮箱地址 60 秒内最多发 3 封 */
  private static readonly EMAIL_MAX_PER_WINDOW = 3;
  private static readonly EMAIL_WINDOW_MS = 60_000;

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: SendRateLimiter,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    this.isDevelopment = nodeEnv !== 'production';

    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') ?? null;
    const enabledFromEnv = this.configService.get<string>('SENDGRID_ENABLED');

    this.isEnabled = enabledFromEnv?.toLowerCase() !== 'false' && Boolean(apiKey) && Boolean(this.fromEmail);

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }

    if (this.isEnabled) {
      this.logger.log('SendGrid email service initialized');
    } else {
      this.logger.warn('SendGrid email is disabled. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to enable.');
    }
  }

  /** 发送通知邮件 */
  async sendNotificationEmail(to: string, subject: string, message?: string | null, details?: EmailDetails, options?: EmailOptions): Promise<void> {
    if (this.isDevelopment) {
      this.logger.warn(`[DEV EMAIL] notification -> ${to}: ${subject}`);
      return;
    }

    if (!this.isEnabled || !this.fromEmail) {
      return;
    }

    if (!this.checkRateLimit(to, 'notification')) return;

    try {
      await sgMail.send({
        to,
        from: this.fromEmail,
        subject,
        text: this.buildText(subject, message, details),
        html: this.buildNotificationHtml(subject, message, details),
        attachments: options?.attachments?.map((a) => ({
          content: a.contentBase64,
          filename: a.filename,
          type: a.type || 'application/octet-stream',
          disposition: a.disposition || 'attachment',
        })),
      });
      this.logger.log(`Email sent: notification -> ${to}`);
    } catch (error: unknown) {
      this.logSendError('notification', to, error);
    }
  }

  /** 发送邮箱验证邮件 */
  async sendVerificationEmail(to: string, verificationUrl: string, recipientName?: string | null): Promise<void> {
    if (this.isDevelopment) {
      this.logger.warn(`[DEV EMAIL] verification -> ${to}: ${verificationUrl}`);
      return;
    }

    if (!this.isEnabled || !this.fromEmail) {
      return;
    }

    if (!this.checkRateLimit(to, 'verification')) return;

    const safeName = this.escapeHtml(recipientName?.trim() || 'there');
    const safeUrl = this.escapeHtml(verificationUrl);
    const subject = 'Verify your PulseBuild email';
    const text = `Hi ${recipientName?.trim() || 'there'},\n\nPlease verify your email address by opening the link below:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nRegards,\nPulseBuild Team`;

    try {
      await sgMail.send({
        to,
        from: this.fromEmail,
        subject,
        text,
        html: this.buildVerificationHtml(safeName, safeUrl),
      });
      this.logger.log(`Email sent: verification -> ${to}`);
    } catch (error: unknown) {
      this.logSendError('verification', to, error);
    }
  }

  /** 发送密码重置邮件 */
  async sendPasswordResetEmail(to: string, resetUrl: string, recipientName?: string | null): Promise<void> {
    if (this.isDevelopment) {
      this.logger.warn(`[DEV EMAIL] password-reset -> ${to}: ${resetUrl}`);
      return;
    }

    if (!this.isEnabled || !this.fromEmail) {
      return;
    }

    if (!this.checkRateLimit(to, 'password-reset')) return;

    const safeName = this.escapeHtml(recipientName?.trim() || 'there');
    const safeUrl = this.escapeHtml(resetUrl);
    const subject = 'Reset your PulseBuild password';
    const text = `Hi ${recipientName?.trim() || 'there'},\n\nWe received a request to reset your password. Click the link below:\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.\n\nRegards,\nPulseBuild Team`;

    try {
      await sgMail.send({
        to,
        from: this.fromEmail,
        subject,
        text,
        html: this.buildPasswordResetHtml(safeName, safeUrl),
      });
      this.logger.log(`Email sent: password-reset -> ${to}`);
    } catch (error: unknown) {
      this.logSendError('password-reset', to, error);
    }
  }

  private checkRateLimit(to: string, label: string): boolean {
    const allowed = this.rateLimiter.consume('email', to, EmailService.EMAIL_MAX_PER_WINDOW, EmailService.EMAIL_WINDOW_MS);
    if (!allowed) {
      this.logger.warn(`Email rate limit exceeded: ${label} -> ${to}, skipping send`);
    }
    return allowed;
  }

  private logSendError(label: string, to: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    const sendgridBody = error && typeof error === 'object' && 'response' in error ? (error as { response?: { body?: unknown } }).response?.body : undefined;
    this.logger.error(`Failed to send ${label} email to ${to}: ${errorMessage}`, sendgridBody ? JSON.stringify(sendgridBody) : undefined);
  }

  private buildText(subject: string, message?: string | null, details?: EmailDetails): string {
    const lines = ['PulseBuild Notification', '', `Subject: ${subject}`, `Message: ${message || subject}`];

    if (details?.projectName) lines.push(`Project: ${details.projectName}`);
    if (details?.location) lines.push(`Location: ${details.location}`);
    if (details?.eventTime) lines.push(`Time: ${details.eventTime}`);
    if (details?.participants?.length) {
      lines.push(`Participants: ${details.participants.join(', ')}`);
    }

    lines.push('', 'Regards,', 'PulseBuild Team');
    return lines.join('\n');
  }

  private buildNotificationHtml(subject: string, message?: string | null, details?: EmailDetails): string {
    const safeSubject = this.escapeHtml(subject);
    const safeMessage = this.escapeHtml(message || subject);

    const rows = [
      { label: 'Project', value: this.escapeHtml(details?.projectName || 'N/A') },
      { label: 'Location', value: this.escapeHtml(details?.location || 'N/A') },
      { label: 'Time', value: this.escapeHtml(details?.eventTime || 'N/A') },
      {
        label: 'Participants',
        value: details?.participants?.length ? details.participants.map((p) => this.escapeHtml(p)).join(', ') : 'N/A',
      },
    ];

    const tableRows = rows
      .map(
        (r) =>
          `<tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f8fafc;width:150px"><strong>${r.label}</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${r.value}</td></tr>`,
      )
      .join('');

    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px"><h2 style="margin-bottom:8px;color:#0f172a">PulseBuild Notification</h2><p style="margin:0 0 12px 0"><strong>Subject:</strong> ${safeSubject}</p><p style="margin:0 0 16px 0">${safeMessage}</p><table style="border-collapse:collapse;width:100%;margin:12px 0 18px 0">${tableRows}</table><p style="margin-top:16px;color:#475569">Regards,<br/>PulseBuild Team</p></div>`;
  }

  private buildVerificationHtml(safeName: string, safeUrl: string): string {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px"><h2 style="margin-bottom:8px;color:#0f172a">Verify your email</h2><p>Hi ${safeName},</p><p>Please confirm this email address for your PulseBuild account.</p><p style="margin:20px 0"><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Verify email</a></p><p>If the button does not work, copy and paste this link into your browser:</p><p><a href="${safeUrl}">${safeUrl}</a></p><p style="color:#475569">This link will expire in 24 hours.</p><p style="margin-top:16px;color:#475569">Regards,<br/>PulseBuild Team</p></div>`;
  }

  private buildPasswordResetHtml(safeName: string, safeUrl: string): string {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px"><h2 style="margin-bottom:8px;color:#0f172a">Reset your password</h2><p>Hi ${safeName},</p><p>We received a request to reset your password for your PulseBuild account.</p><p style="margin:20px 0"><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Reset password</a></p><p>If the button does not work, copy and paste this link into your browser:</p><p><a href="${safeUrl}">${safeUrl}</a></p><p style="color:#475569">This link will expire in 1 hour.</p><p style="color:#475569">If you did not request this, please ignore this email.</p><p style="margin-top:16px;color:#475569">Regards,<br/>PulseBuild Team</p></div>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}
