/**
 * 应用 Context - tRPC 请求上下文
 *
 * 为所有 tRPC 路由提供统一的 context 结构。
 * 支持 Better Auth 的 session 信息注入。
 */
import { Injectable } from '@nestjs/common';
import { TRPCContext } from 'nestjs-trpc';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthInstance } from '../auth/auth';

/** Better Auth 会话类型 */
type SessionData = UserSession<AuthInstance>;

/**
 * 应用 Context 类型
 *
 * 使用索引签名兼容 tRPC 的 Record<string, unknown> 要求
 */
export type AppContextType = {
  /** Express request 对象 */
  req: CreateExpressContextOptions['req'];
  /** Express response 对象 */
  res: CreateExpressContextOptions['res'];
  /** 当前登录用户（由 AuthGuard 注入到 session） */
  session?: SessionData;
  /** 用户 ID（快捷访问） */
  userId?: string;
  [key: string]: unknown;
};

@Injectable()
export class AppContext implements TRPCContext {
  /**
   * 创建 tRPC context
   *
   * 从 Express request 中提取 session 信息（由 Better Auth 的 AuthGuard 注入）
   */
  async create(opts: CreateExpressContextOptions): Promise<AppContextType> {
    // session 由 Better Auth 的 AuthGuard 注入到 request
    const session = (opts.req as { session?: SessionData }).session;

    return {
      req: opts.req,
      res: opts.res,
      session,
      userId: session?.user?.id,
    };
  }
}
