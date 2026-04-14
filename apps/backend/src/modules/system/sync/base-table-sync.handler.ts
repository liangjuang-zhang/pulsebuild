/**
 * 表同步处理器基类
 *
 * 提供通用的冲突检测和变更应用逻辑
 * 子类只需实现查询和转换方法
 */
import { SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { TableSyncHandler, TableChanges } from './table-sync-handler.interface';

/**
 * 抽象基类 - 实现通用同步逻辑
 *
 * 子类只需实现特定的查询和转换方法
 */
export abstract class BaseTableSyncHandler implements TableSyncHandler {
  abstract tableName: string;

  /**
   * 查询变更记录 - 子类可覆写自定义逻辑
   */
  async queryChanges(db: unknown, scope: { userId: string }, lastPulledAt: number | null): Promise<TableChanges> {
    const created: Record<string, string | number | boolean | null>[] = [];
    const updated: Record<string, string | number | boolean | null>[] = [];
    const deleted: string[] = [];

    // 构建基础查询条件
    const baseConditions = this.buildScopeConditions(scope);

    // 查询活跃记录
    const activeRecords = await this.queryActiveRecords(db, baseConditions, lastPulledAt);

    for (const record of activeRecords) {
      const rawRecord = this.toRawRecord(record);
      if (lastPulledAt === null) {
        created.push(rawRecord);
      } else {
        updated.push(rawRecord);
      }
    }

    // 查询已删除记录
    const deletedIds = await this.queryDeletedRecords(db, baseConditions, lastPulledAt);
    deleted.push(...deletedIds);

    return { created, updated, deleted };
  }

  /**
   * 应用变更 - 通用冲突检测逻辑
   */
  async applyChanges(tx: unknown, changes: TableChanges, scope: { userId: string }, lastPulledAt: number): Promise<void> {
    // 应用创建的记录
    for (const raw of changes.created) {
      await this.applyCreate(tx, raw, lastPulledAt);
    }

    // 应用更新的记录
    for (const raw of changes.updated) {
      await this.applyUpdate(tx, raw, lastPulledAt);
    }

    // 应用删除的记录
    for (const id of changes.deleted) {
      await this.applyDelete(tx, id);
    }
  }

  /**
   * 应用创建记录 - 带冲突检测
   */
  protected async applyCreate(tx: unknown, raw: Record<string, string | number | boolean | null>, lastPulledAt: number): Promise<void> {
    const id = raw.id as string;
    const existing = await this.findRecordById(tx, id);

    if (existing) {
      // 已存在 - 检查冲突后更新
      this.checkConflict(existing, lastPulledAt, id);
      await this.updateRecord(tx, id, this.toDbInsert(raw));
    } else {
      // 不存在 - 创建
      await this.insertRecord(tx, this.toDbInsert(raw));
    }
  }

  /**
   * 应用更新记录 - 带冲突检测
   */
  protected async applyUpdate(tx: unknown, raw: Record<string, string | number | boolean | null>, lastPulledAt: number): Promise<void> {
    const id = raw.id as string;
    const existing = await this.findRecordById(tx, id);

    if (existing) {
      this.checkConflict(existing, lastPulledAt, id);
      await this.updateRecord(tx, id, this.toDbInsert(raw));
    } else {
      // 不存在 - 按 WatermelonDB 规范创建
      await this.insertRecord(tx, this.toDbInsert(raw));
    }
  }

  /**
   * 应用删除 - 软删除
   */
  protected async applyDelete(tx: unknown, id: string): Promise<void> {
    const existing = await this.findRecordById(tx, id);
    if (existing) {
      await this.softDeleteRecord(tx, id);
    }
    // 不存在则忽略（符合规范）
  }

  /**
   * 冲突检测
   */
  protected checkConflict(record: unknown, lastPulledAt: number, id: string): void {
    const lastModified = this.getLastModifiedValue(record);
    if (lastModified && lastModified > lastPulledAt) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `记录 ${id} 在拉取后被服务器修改`,
      });
    }
  }

  // 子类必须实现的抽象方法

  /** 构建范围查询条件 */
  protected abstract buildScopeConditions(scope: { userId: string }): SQL[];

  /** 查询活跃记录 */
  protected abstract queryActiveRecords(db: unknown, conditions: SQL[], lastPulledAt: number | null): Promise<unknown[]>;

  /** 查询已删除记录 */
  protected abstract queryDeletedRecords(db: unknown, conditions: SQL[], lastPulledAt: number | null): Promise<string[]>;

  /** 根据 ID 查找记录 */
  protected abstract findRecordById(tx: unknown, id: string): Promise<unknown>;

  /** 插入记录 */
  protected abstract insertRecord(tx: unknown, data: unknown): Promise<void>;

  /** 更新记录 */
  protected abstract updateRecord(tx: unknown, id: string, data: unknown): Promise<void>;

  /** 软删除记录 */
  protected abstract softDeleteRecord(tx: unknown, id: string): Promise<void>;

  /** 获取最后修改时间值（毫秒） */
  protected abstract getLastModifiedValue(record: unknown): number | null;

  /** 转换为 WatermelonDB 格式 */
  abstract toRawRecord(record: unknown): Record<string, string | number | boolean | null>;

  /** 转换为数据库插入格式 */
  abstract toDbInsert(raw: Record<string, string | number | boolean | null>): unknown;
}
