import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database';

/**
 * 创建 Better Auth 实例的工厂函数
 * @param database - Drizzle 数据库连接实例（通过 DI 注入）
 */
export function createAuth(database: NodePgDatabase) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema,
    }),
    plugins: [
      phoneNumber({
        // 发送验证码（集成短信服务商）
        sendOTP: ({ phoneNumber, code }) => {
          // TODO: 集成短信服务
          console.log(`发送验证码到 ${phoneNumber}: ${code}`);
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
