/**
 * 同步管理器 - WatermelonDB 官方同步实现
 * https://watermelondb.dev/docs/Sync/Intro
 *
 * 使用 tRPC vanilla client 调用后端 sync 接口，
 * 自动处理认证 cookie、类型安全、请求格式。
 */
import { synchronize, hasUnsyncedChanges } from '@nozbe/watermelondb/sync';
import { database } from './database';
import { authClient } from '@/lib/auth-client';
import { trpcVanilla } from '@/lib/trpc-vanilla';
import { captureAnalyticsEvent } from '@/lib/monitoring/posthog';

/**
 * 从后端拉取变更（通过 tRPC）
 * 实现 WatermelonDB pullChanges 协议
 */
async function pullChanges(params: {
  lastPulledAt?: number;
  schemaVersion: number;
  migration: any;
}) {
  const result = await trpcVanilla.sync.pull.query({
    lastPulledAt: params.lastPulledAt ?? null,
    schemaVersion: params.schemaVersion,
    migration: params.migration ?? null,
  });

  return { changes: result.changes, timestamp: result.timestamp };
}

/**
 * 推送本地变更到后端（通过 tRPC）
 * 实现 WatermelonDB pushChanges 协议
 */
async function pushChanges({
  changes,
  lastPulledAt,
}: {
  changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>;
  lastPulledAt: number;
}) {
  console.log('[Sync] pushChanges:', {
    lastPulledAt,
    changes: JSON.stringify(changes, null, 2),
  });
  await trpcVanilla.sync.push.mutate({
    changes,
    lastPulledAt,
  });
}

/**
 * 同步本地数据库与后端
 * 可定期调用或在重要本地变更后调用
 */
export async function syncDatabase(): Promise<void> {
  // 检查用户是否已登录
  const session = await authClient.getSession();
  if (!session.data?.user?.id) {
    console.log('[Sync] 未登录，跳过同步');
    return;
  }

  // 检查是否有未同步的变更
  const needsSync = await hasUnsyncedChanges({ database });
  console.log('[Sync] needsSync:', needsSync);

  // 查看本地记录的 sync 状态
  try {
    const users = await database.get('user').query().fetch();
    for (const user of users) {
      console.log('[Sync] 本地用户 sync 状态:', {
        id: user.id,
        _status: user._raw._status,
        _changed: user._raw._changed,
      });
    }
  } catch (e) {
    console.log('[Sync] 查询用户状态失败:', e);
  }

  try {
    await synchronize({
      database,
      pullChanges,
      pushChanges,
      // 首次启用迁移的 schema 版本
      migrationsEnabledAtVersion: 5,
    });

    captureAnalyticsEvent('sync_completed', {
      userId: session.data.user.id,
    });

    console.log('[Sync] 同步完成');
  } catch (error) {
    console.error('[Sync] 同步失败:', error);

    captureAnalyticsEvent('sync_failed', {
      userId: session.data.user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * 检查是否有未同步的本地变更
 */
export async function checkNeedsSync(): Promise<boolean> {
  try {
    return await hasUnsyncedChanges({ database });
  } catch (error) {
    console.error('[Sync] 检查未同步变更失败:', error);
    return false;
  }
}

/**
 * 获取上次同步时间戳（本地存储）
 * 用于 UI 展示
 */
export async function getLastSyncTimestamp(): Promise<number | null> {
  const session = await authClient.getSession();
  if (!session.data?.user?.id) {
    return null;
  }

  // 查询本地记录中最近的 last_modified
  const users = await database.get('user').query().fetch();
  if (users.length === 0) {
    return null;
  }

  const latestTimestamp = users.reduce((max, user: any) => {
    const timestamp = user.lastModified || 0;
    return Math.max(max, timestamp);
  }, 0);

  return latestTimestamp > 0 ? latestTimestamp : null;
}

/**
 * 同步管理器实例，供全应用使用
 */
export const syncManager = {
  sync: syncDatabase,
  needsSync: checkNeedsSync,
  getLastSyncTimestamp,
};