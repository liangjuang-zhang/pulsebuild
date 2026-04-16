/**
 * 认证中间件 - tRPC 鉴权
 *
 * 检查 AppContext 中是否包含有效 session（由 AppContext.create 从 cookie 解析）。
 * 未登录则抛出 UNAUTHORIZED。
 */
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TRPCMiddleware, MiddlewareOptions, MiddlewareResponse } from 'nestjs-trpc';
import { UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthInstance } from '../auth/auth';

/** Better Auth 会话类型 */
type SessionData = UserSession<AuthInstance>;

/** 扩展后的 Context 类型 */
export type AuthenticatedContext = {
  /** 用户会话 */
  session: SessionData;
  /** 用户 ID */
  userId: string;
  [key: string]: unknown;
};

@Injectable()
export class AuthMiddleware implements TRPCMiddleware {
  use(opts: MiddlewareOptions): MiddlewareResponse {
    // session 由 AppContext.create() 从 cookie 解析后放在 ctx 上
    const ctx = opts.ctx as { session?: SessionData; userId?: string };
    const session = ctx.session;

    if (!session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '未登录或会话已过期',
      });
    }

    return opts.next({
      ctx: {
        ...opts.ctx,
        session,
        userId: session.user.id,
      } as AuthenticatedContext,
    });
  }
}
