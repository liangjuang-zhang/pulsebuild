/**
 * 同步路由 - WatermelonDB 同步协议 tRPC 接口
 *
 * 实现拉取和推送接口：
 * https://watermelondb.dev/docs/Sync/Backend
 *
 * 认证要求：
 * - AuthGuard（NestJS）将 session 注入到 request
 * - AuthMiddleware（tRPC）从 session 提取 userId 注入到 context
 * - 路由可直接使用 ctx.userId，无需手动检查
 */
import { Inject } from '@nestjs/common';
import { Mutation, Query, Router, Ctx, UseMiddlewares } from 'nestjs-trpc';
import { SyncService } from './sync.service';
import { PullInputSchema, PullOutputSchema, PushInputSchema, PushOutputSchema } from './sync.schema';
import type { PullInput, PushInput } from './sync.schema';
import { AuthMiddleware, type AuthenticatedContext } from '../../auth/auth.middleware';

@Router({ alias: 'sync' })
@UseMiddlewares(AuthMiddleware)
export class SyncRouter {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {}

  /**
   * 拉取变更 - 从服务器获取 lastPulledAt 后的所有变更
   *
   * WatermelonDB 调用参数：
   * - lastPulledAt: 上次成功拉取的时间戳（首次同步为 null）
   * - schemaVersion: 本地 schema 版本
   * - migration: schema 迁移信息（如有）
   */
  @Query({
    input: PullInputSchema,
    output: PullOutputSchema,
  })
  async pull(@Inject('input') input: PullInput, @Ctx() ctx: AuthenticatedContext): Promise<{ changes: Record<string, unknown>; timestamp: number }> {
    return await this.syncService.pullChanges(input, ctx.userId);
  }

  /**
   * 推送变更 - 将本地变更应用到服务器
   *
   * WatermelonDB 调用参数：
   * - changes: { [表名]: { created, updated, deleted } }
   * - lastPulledAt: 上次成功拉取的时间戳
   */
  @Mutation({
    input: PushInputSchema,
    output: PushOutputSchema,
  })
  async push(@Inject('input') input: PushInput, @Ctx() ctx: AuthenticatedContext): Promise<{ success: boolean }> {
    return await this.syncService.pushChanges(input, ctx.userId);
  }
}
