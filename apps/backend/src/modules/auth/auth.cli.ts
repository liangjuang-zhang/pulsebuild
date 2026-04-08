import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

/**
 * Better Auth CLI 配置文件
 * 仅用于 `pnpm dlx auth generate` 命令生成数据库 schema
 *
 * 注意：此文件不用于实际运行时，运行时配置见 createAuth()
 */
export const auth = betterAuth({
  database: drizzleAdapter(
    {},
    {
      provider: 'pg',
    },
  ),
  plugins: [],
});

export default auth;
