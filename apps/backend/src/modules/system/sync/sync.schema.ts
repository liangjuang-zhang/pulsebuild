/**
 * 同步 Schema - WatermelonDB 同步协议的 Zod schemas
 */
import { z } from 'zod';

/**
 * 迁移信息 schema
 */
export const MigrationSchema = z
  .object({
    from: z.number(),
    tables: z.array(z.string()).optional(),
    columns: z
      .array(
        z.object({
          table: z.string(),
          column: z.string(),
        }),
      )
      .optional(),
  })
  .nullable();

/**
 * 拉取输入 schema
 */
export const PullInputSchema = z.object({
  lastPulledAt: z.number().nullable(),
  schemaVersion: z.number(),
  migration: MigrationSchema,
});

/**
 * 原始记录 schema（用于变更）
 */
export const RawRecordSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

/**
 * 每表变更 schema
 */
export const TableChangesSchema = z.object({
  created: z.array(RawRecordSchema),
  updated: z.array(RawRecordSchema),
  deleted: z.array(z.string()),
});

/**
 * 完整变更 schema
 */
export const ChangesSchema = z.record(z.string(), TableChangesSchema);

// 导出类型供路由和服务使用
export type PullInput = z.infer<typeof PullInputSchema>;
export type PushInput = z.infer<typeof PushInputSchema>;
export type Changes = z.infer<typeof ChangesSchema>;

/**
 * 拉取输出 schema
 */
export const PullOutputSchema = z.object({
  changes: ChangesSchema,
  timestamp: z.number(),
});

/**
 * 推送输入 schema
 */
export const PushInputSchema = z.object({
  changes: ChangesSchema,
  lastPulledAt: z.number(),
});

/**
 * 推送输出 schema
 */
export const PushOutputSchema = z.object({
  success: z.boolean(),
});
