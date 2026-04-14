/**
 * 用户表同步处理器
 *
 * 处理 WatermelonDB 用户表的同步逻辑
 */
import { Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, gt, isNull, isNotNull, and, SQL } from 'drizzle-orm';
import * as schema from '../../../../database';
import { user } from '../../../../database/auth.schema';
import { BaseTableSyncHandler } from '../base-table-sync.handler';

/** 用户表记录类型 */
type UserRecord = typeof user.$inferSelect;

/** 用户表插入类型 */
type UserInsert = typeof user.$inferInsert;

@Injectable()
export class UserSyncHandler extends BaseTableSyncHandler {
  tableName = 'users';

  /**
   * 构建范围查询条件 - 用户表只查询当前用户
   */
  protected buildScopeConditions(scope: { userId: string }): SQL[] {
    return [eq(user.id, scope.userId)];
  }

  /**
   * 查询活跃记录（未删除）
   */
  protected async queryActiveRecords(db: unknown, conditions: SQL[], lastPulledAt: number | null): Promise<unknown[]> {
    const dbTyped = db as NodePgDatabase<typeof schema>;
    const whereConditions = [...conditions, isNull(user.deletedAt)];
    if (lastPulledAt) {
      whereConditions.push(gt(user.lastModified, new Date(lastPulledAt)));
    }

    return dbTyped
      .select()
      .from(user)
      .where(and(...whereConditions));
  }

  /**
   * 查询已删除记录（软删除）
   */
  protected async queryDeletedRecords(db: unknown, conditions: SQL[], lastPulledAt: number | null): Promise<string[]> {
    const dbTyped = db as NodePgDatabase<typeof schema>;
    const whereConditions: (SQL | undefined)[] = [...conditions, isNotNull(user.deletedAt)];
    if (lastPulledAt) {
      whereConditions.push(gt(user.lastModified, new Date(lastPulledAt)));
    }

    const records = await dbTyped
      .select({ id: user.id })
      .from(user)
      .where(and(...whereConditions));

    return records.map((r) => r.id);
  }

  /**
   * 根据 ID 查找记录
   */
  protected async findRecordById(tx: unknown, id: string): Promise<unknown> {
    const txTyped = tx as NodePgDatabase<typeof schema>;
    const [record] = await txTyped.select().from(user).where(eq(user.id, id)).limit(1);
    return record ?? null;
  }

  /**
   * 插入记录
   */
  protected async insertRecord(tx: unknown, data: unknown): Promise<void> {
    const txTyped = tx as NodePgDatabase<typeof schema>;
    await txTyped.insert(user).values(data as UserInsert);
  }

  /**
   * 更新记录
   */
  protected async updateRecord(tx: unknown, id: string, data: unknown): Promise<void> {
    const txTyped = tx as NodePgDatabase<typeof schema>;
    await txTyped
      .update(user)
      .set(data as UserInsert)
      .where(eq(user.id, id));
  }

  /**
   * 软删除记录
   */
  protected async softDeleteRecord(tx: unknown, id: string): Promise<void> {
    const txTyped = tx as NodePgDatabase<typeof schema>;
    await txTyped.update(user).set({ deletedAt: new Date(), lastModified: new Date() }).where(eq(user.id, id));
  }

  /**
   * 获取最后修改时间值（毫秒）
   */
  protected getLastModifiedValue(record: unknown): number | null {
    const typedRecord = record as UserRecord;
    return typedRecord.lastModified?.getTime() ?? null;
  }

  /**
   * 转换为 WatermelonDB 格式
   *
   * Date 对象 → 毫秒时间戳
   */
  toRawRecord(record: unknown): Record<string, string | number | boolean | null> {
    const typedRecord = record as UserRecord;
    return {
      id: typedRecord.id,
      name: typedRecord.name,
      email: typedRecord.email,
      emailVerified: typedRecord.emailVerified,
      image: typedRecord.image,
      phoneNumber: typedRecord.phoneNumber,
      phoneNumberVerified: typedRecord.phoneNumberVerified,
      countryCode: typedRecord.countryCode,
      timezone: typedRecord.timezone,
      jobTitle: typedRecord.jobTitle,
      companyName: typedRecord.companyName,
      status: typedRecord.status,
      lastModified: typedRecord.lastModified?.getTime() ?? Date.now(),
      deletedAt: typedRecord.deletedAt?.getTime() ?? null,
      lastLoginAt: typedRecord.lastLoginAt?.getTime() ?? null,
      createdAt: typedRecord.createdAt?.getTime() ?? Date.now(),
      updatedAt: typedRecord.updatedAt?.getTime() ?? Date.now(),
    };
  }

  /**
   * 转换为数据库插入格式
   *
   * 毫秒时间戳 → Date 对象
   */
  toDbInsert(raw: Record<string, string | number | boolean | null>): unknown {
    return {
      id: raw.id as string,
      name: raw.name as string,
      email: raw.email as string,
      emailVerified: (raw.emailVerified as boolean) ?? false,
      image: raw.image as string | null,
      phoneNumber: raw.phoneNumber as string | null,
      phoneNumberVerified: (raw.phoneNumberVerified as boolean) ?? false,
      countryCode: raw.countryCode as string | null,
      timezone: raw.timezone as string | null,
      jobTitle: raw.jobTitle as string | null,
      companyName: raw.companyName as string | null,
      status: (raw.status as string) ?? 'active',
      lastModified: new Date((raw.lastModified as number) ?? Date.now()),
      updatedAt: new Date((raw.updatedAt as number) ?? Date.now()),
    } as UserInsert;
  }
}
