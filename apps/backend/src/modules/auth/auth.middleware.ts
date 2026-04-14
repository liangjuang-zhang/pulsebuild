/**
 * 认证中间件 - tRPC 全局鉴权
 *
 * 在所有 tRPC 路由执行前检查用户登录状态。
 * 从 request.session 中提取用户信息，注入到 context。
 *
 * 流程：
 * 1. Better Auth 的 AuthGuard 已将 session 注入到 request
 * 2. AuthMiddleware 从 session 中提取 userId
 * 3. 通过 next({ ctx }) 扩展 context，供后续路由使用
 */
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TRPCMiddleware, MiddlewareOptions, MiddlewareResponse } from 'nestjs-trpc';
import { UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthInstance } from '../auth/auth';

/** Better Auth 会话类型 */
type SessionData = UserSession<AuthInstance>;

/** 含 session 的 Request 类型 */
type RequestWithSession = { session?: SessionData };

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
  /**
   * 中间件执行逻辑
   *
   * 检查 session 是否存在，注入 userId 到 context。
   * 未登录则抛出 UNAUTHORIZED 错误。
   */
  use(opts: MiddlewareOptions): MiddlewareResponse {
    // 从 context.req 中获取 session（由 AuthGuard 注入）
    const ctx = opts.ctx as { req?: RequestWithSession };
    const session = ctx.req?.session;

    if (!session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '未登录或会话已过期',
      });
    }

    // 扩展 context，注入认证信息
    return opts.next({
      ctx: {
        ...opts.ctx,
        session,
        userId: session.user.id,
      } as AuthenticatedContext,
    });
  }
}
