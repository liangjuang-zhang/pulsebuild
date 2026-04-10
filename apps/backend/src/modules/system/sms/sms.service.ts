import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio, { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;
  private readonly fromNumber: string | null;
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
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
    const message = `【PulseBuild】您的验证码是 ${code}，${Math.floor(300 / 60)} 分钟内有效。`;
    await this.send(phone, message, 'verification-code');
  }

  async sendInviteLink(phone: string, inviteUrl: string): Promise<void> {
    const message = `【PulseBuild】您已被邀请加入团队，点击链接注册: ${inviteUrl}`;
    await this.send(phone, message, 'invite-link');
  }

  private async send(phone: string, message: string, label: string): Promise<void> {
    if (this.isDevelopment) {
      this.logger.warn(`[DEV SMS] ${label} → ${phone}: ${message}`);
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
