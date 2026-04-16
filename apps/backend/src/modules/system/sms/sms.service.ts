import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio, { Twilio } from 'twilio';
import { SendRateLimiter } from '../../../common/throttling';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;
  private readonly fromNumber: string | null;
  private readonly isDevelopment: boolean;

  /** 每个手机号 60 秒内最多发 3 条 */
  private static readonly SMS_MAX_PER_WINDOW = 3;
  private static readonly SMS_WINDOW_MS = 60_000;

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: SendRateLimiter,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    this.isDevelopment = nodeEnv !== 'production';
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER') ?? null;

    if (!this.isDevelopment) {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

      if (accountSid && authToken) {
        this.client = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized');
      } else {
        this.logger.warn('Twilio credentials not configured, SMS will not be sent');
      }
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const message = `Your PulseBuild verification code is ${code}. Valid for ${Math.floor(300 / 60)} minutes. Do not share this code.`;
    await this.send(phone, message, 'verification-code');
  }

  async sendInviteLink(phone: string, inviteUrl: string): Promise<void> {
    const message = `You have been invited to join PulseBuild. Click to register: ${inviteUrl}`;
    await this.send(phone, message, 'invite-link');
  }

  private async send(phone: string, message: string, label: string): Promise<void> {
    if (this.isDevelopment) {
      this.logger.warn(`[DEV SMS] ${label} → ${phone}: ${message}`);
      return;
    }

    if (!this.rateLimiter.consume('sms', phone, SmsService.SMS_MAX_PER_WINDOW, SmsService.SMS_WINDOW_MS)) {
      this.logger.warn(`SMS rate limit exceeded: ${label} -> ${phone}, skipping send`);
      return;
    }

    if (!this.client || !this.fromNumber) {
      throw new Error('SMS service not configured: missing Twilio credentials or phone number');
    }

    try {
      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: phone,
        body: message,
      });
      this.logger.log(`SMS sent: ${label} → ${phone}, sid=${result.sid}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`SMS send failed: ${label} → ${phone}: ${errorMessage}`);
      throw new Error(`Failed to send SMS: ${errorMessage}`);
    }
  }
}
