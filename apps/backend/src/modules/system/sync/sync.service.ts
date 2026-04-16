/**
 * 同步服务 - 处理 WatermelonDB 同步协议操作
 *
 * 使用注册表模式支持多表同步：
 * - 添加新表只需实现 TableSyncHandler 接口并注册
 * - 核心逻辑通过遍历处理器自动处理所有表
 *
 * 实现后端同步规范：
 * https://watermelondb.dev/docs/Sync/Backend
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../../database/database.module';
import * as schema from '../../../database';
import type { PullInput, PushInput, Changes } from './sync.schema';
import { TableSyncHandler } from './table-sync-handler.interface';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  /** 同步处理器注册表 */
  private handlers: Map<string, TableSyncHandler> = new Map();

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * 注册同步处理器
   *
   * @param handler 表同步处理器实例
   */
  registerHandler(handler: TableSyncHandler): void {
    this.handlers.set(handler.tableName, handler);
    this.logger.log(`[同步] 注册处理器: ${handler.tableName}`);
  }

  /**
   * 拉取变更 - 获取 lastPulledAt 之后的所有变更
   *
   * @param input 拉取参数，包含 lastPulledAt 时间戳
   * @param userId 用户 ID
   * @returns 变更数据和新时间戳
   */
  async pullChanges(input: PullInput, userId: string): Promise<{ changes: Changes; timestamp: number }> {
    const lastPulledAt = input.lastPulledAt;
    const timestamp = Date.now();

    // 初始化空的变更对象
    const changes: Changes = {};

    try {
      // 遍历所有注册的处理器
      for (const [tableName, handler] of this.handlers) {
        const tableChanges = await handler.queryChanges(this.db, { userId }, lastPulledAt);
        changes[tableName] = tableChanges;
      }

      this.logger.log(`[同步] 用户 ${userId} 拉取完成，时间戳: ${timestamp}`);
      return { changes, timestamp };
    } catch (error) {
      this.logger.error('[同步] 拉取失败:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '拉取变更失败',
      });
    }
  }

  /**
   * 推送变更 - 将客户端变更应用到服务器
   *
   * @param input 推送参数，包含变更数据和时间戳
   * @param userId 用户 ID
   * @returns 成功状态
   */
  async pushChanges(input: PushInput, userId: string): Promise<{ success: boolean }> {
    const { changes, lastPulledAt } = input;

    // 添加日志追踪 push 数据
    this.logger.log(`[同步] 用户 ${userId} 推送请求: lastPulledAt=${lastPulledAt}`);
    for (const [tableName, tableChanges] of Object.entries(changes)) {
      this.logger.log(`[同步] 表 ${tableName}: created=${tableChanges.created.length}, updated=${tableChanges.updated.length}, deleted=${tableChanges.deleted.length}`);
      if (tableChanges.updated.length > 0) {
        this.logger.log(`[同步] 更新数据: ${JSON.stringify(tableChanges.updated, null, 2)}`);
      }
    }

    try {
      // 在事务中应用所有变更
      await this.db.transaction(async (tx) => {
        for (const [tableName, tableChanges] of Object.entries(changes)) {
          const handler = this.handlers.get(tableName);
          if (!handler) {
            this.logger.warn(`[同步] 未知表: ${tableName}，跳过`);
            continue;
          }
          await handler.applyChanges(tx, tableChanges, { userId }, lastPulledAt);
        }
      });

      this.logger.log(`[同步] 用户 ${userId} 推送完成`);
      return { success: true };
    } catch (error) {
      this.logger.error('[同步] 推送失败:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '推送变更失败',
      });
    }
  }
}
