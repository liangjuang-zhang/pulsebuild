import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database';
import { SmsService } from '../system/sms/sms.service';
import { EmailService } from '../system/email/email.service';

/**
 * 创建 Better Auth 实例的工厂函数
 * @param database - Drizzle 数据库连接实例（通过 DI 注入）
 * @param smsService - 短信服务实例（通过 DI 注入）
 * @param emailService - 邮件服务实例（通过 DI 注入）
 */
export function createAuth(database: NodePgDatabase, smsService: SmsService, emailService: EmailService) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema,
    }),
    trustedOrigins: [
      'pulsebuild://',
      ...(process.env.NODE_ENV === 'development'
        ? [
            // Expo 开发环境
            'exp://',
          ]
        : []),
    ],
    // 扩展 user 表字段
    user: {
      additionalFields: {
        countryCode: { type: 'string', required: false },
        timezone: { type: 'string', required: false },
        jobTitle: { type: 'string', required: false },
        companyName: { type: 'string', required: false },
        status: { type: 'string', required: false, defaultValue: 'active' },
        onboardingCompletedAt: { type: 'date', required: false },
        onboardingSkippedSteps: { type: 'string', required: false },
        deletedAt: { type: 'date', required: false },
        lastLoginAt: { type: 'date', required: false },
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user: authUser, newEmail, url }) => {
          await emailService.sendVerificationEmail(newEmail, url, authUser.name);
        },
      },
    },
    // 邮箱验证配置
    emailVerification: {
      sendOnSignUp: false, // 手机号注册时用 temp email，不发
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: authUser, url }) => {
        await emailService.sendVerificationEmail(authUser.email, url, authUser.name);
      },
    },
    plugins: [
      expo(),
      phoneNumber({
        sendOTP: async ({ phoneNumber: phone, code }) => {
          await smsService.sendVerificationCode(phone, code);
        },
        otpLength: 6,
        expiresIn: 300,
        allowedAttempts: 3,
        signUpOnVerification: {
          getTempEmail: (phoneNumber) => `${phoneNumber}@temp.com`,
          getTempName: (phoneNumber) => phoneNumber,
        },
        requireVerification: true,
      }),
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
