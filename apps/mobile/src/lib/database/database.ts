/**
 * WatermelonDB 数据库初始化
 * 支持官方 WatermelonDB 同步（synchronize 函数）
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import { User, Project, Task } from './models';

console.log('[WatermelonDB] Database module: loaded');
console.log('[WatermelonDB] SQLiteAdapter:', typeof SQLiteAdapter);

// WatermelonDB 模型类
const modelClasses = [User, Project, Task];

// 延迟初始化：避免模块加载阶段崩溃
let _database: Database | null = null;

function createDatabase(): Database {
  console.log('[WatermelonDB] Creating SQLiteAdapter...');
  const adapter = new SQLiteAdapter({
    schema,
    migrations,
    dbName: 'pulsebuild_db',
    jsi: true,
    onSetUpError: (error: Error) => {
      console.error('[WatermelonDB] 数据库设置失败:', error);
    },
  });

  console.log('[WatermelonDB] Creating Database instance...');
  return new Database({
    adapter,
    modelClasses,
  });
}

export const database: Database = new Proxy({} as Database, {
  get(_target, prop) {
    if (!_database) {
      _database = createDatabase();
    }
    return (_database as any)[prop];
  },
});

// 追踪初始化状态
let isInitialized = false;

/**
 * 应用启动时初始化数据库
 * 在执行任何数据库操作前调用此函数
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // 通过执行写操作强制初始化
    await database.write(async () => {
      // 空写操作触发 schema 创建/迁移
    });
    isInitialized = true;
    console.log('[WatermelonDB] 数据库初始化成功（版本:', schema.version, ')');
  } catch (error) {
    console.error('[WatermelonDB] 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database {
  return database;
}

/**
 * 重置数据库（用于登出或测试）
 * 警告：此操作会删除所有本地数据！
 */
export async function resetDatabase(): Promise<void> {
  try {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    isInitialized = false;
    console.log('[WatermelonDB] 数据库重置成功');
  } catch (error) {
    console.error('[WatermelonDB] 数据库重置失败:', error);
    throw error;
  }
}

/**
 * 检查数据库是否已初始化
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}