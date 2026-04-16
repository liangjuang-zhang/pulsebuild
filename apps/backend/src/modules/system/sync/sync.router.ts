/**
 * 同步路由 - WatermelonDB 同步协议 tRPC 接口
 *
 * 实现拉取和推送接口：
 * https://watermelondb.dev/docs/Sync/Backend
 *
 * 认证要求：
 * - AuthMiddleware（tRPC）从 cookie 提取 userId 注入到 context
 * - PermissionMiddleware（无权限要求，直接放行）
 * - 路由可直接使用 ctx.userId，无需手动检查
 */
import { Inject } from '@nestjs/common';
import { Query, Mutation, Router, UseMiddlewares, Input, Ctx } from 'nestjs-trpc';
import { SyncService } from './sync.service';
import { PullInputSchema, PullOutputSchema, PushInputSchema, PushOutputSchema } from './sync.schema';
import type { PullInput, PushInput } from './sync.schema';
import { AuthMiddleware, type AuthenticatedContext } from '../../auth/auth.middleware';
import { PermissionMiddleware } from '../../auth/permission.middleware';

@Router({ alias: 'sync' })
@UseMiddlewares(AuthMiddleware, PermissionMiddleware)
export class SyncRouter {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {}

  /** 拉取变更 - 从服务器获取 lastPulledAt 后的所有变更 */
  @Query({
    input: PullInputSchema,
    output: PullOutputSchema,
  })
  async pull(@Input() input: PullInput, @Ctx() ctx: AuthenticatedContext): Promise<{ changes: Record<string, unknown>; timestamp: number }> {
    return await this.syncService.pullChanges(input, ctx.userId);
  }

  /** 推送变更 - 将本地变更应用到服务器 */
  @Mutation({
    input: PushInputSchema,
    output: PushOutputSchema,
  })
  async push(@Input() input: PushInput, @Ctx() ctx: AuthenticatedContext): Promise<{ success: boolean }> {
    return await this.syncService.pushChanges(input, ctx.userId);
  }
}