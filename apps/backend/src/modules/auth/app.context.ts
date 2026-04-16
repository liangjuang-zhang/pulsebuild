/**
 * 应用 Context - tRPC 请求上下文
 *
 * 为所有 tRPC 路由提供统一的 context 结构。
 * 主动从 cookie 解析 Better Auth session（tRPC 路由不经过 NestJS guard 管道）。
 */
import { Injectable } from '@nestjs/common';
import { TRPCContext } from 'nestjs-trpc';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { AuthService, UserSession } from '@thallesp/nestjs-better-auth';
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
  /** 当前登录用户 session */
  session?: SessionData;
  /** 用户 ID（快捷访问） */
  userId?: string;
  [key: string]: unknown;
};

@Injectable()
export class AppContext implements TRPCContext {
  constructor(private readonly authService: AuthService<AuthInstance>) {}

  /**
   * 创建 tRPC context
   *
   * 主动调用 Better Auth API 从 cookie 解析 session，
   * 而非依赖 NestJS AuthGuard（tRPC 路由不走 guard 管道）。
   */
  async create(opts: CreateExpressContextOptions): Promise<AppContextType> {
    let session: SessionData | undefined;

    try {
      // 将 Express req 转换为 Request 对象供 Better Auth 解析
      const headers = new Headers();
      for (const [key, value] of Object.entries(opts.req.headers)) {
        if (typeof value === 'string') {
          headers.set(key, value);
        }
      }

      const result = await this.authService.api.getSession({
        headers,
      });

      if (result) {
        session = result as SessionData;
      }
    } catch {
      // session 解析失败，保持 undefined
    }

    return {
      req: opts.req,
      res: opts.res,
      session,
      userId: session?.user?.id,
    };
  }
}
