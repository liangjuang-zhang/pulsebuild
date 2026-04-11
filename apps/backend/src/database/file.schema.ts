import { pgTable, text, timestamp, bigint, varchar, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

/**
 * 系统文件表
 *
 * 统一文件管理，支持多存储后端（local / s3 / oss 等）。
 * URL 不存库，由 service 根据 storageProvider + fileKey 动态生成。
 */
export const sysFile = pgTable(
  'sys_file',
  {
    id: text('id').primaryKey(),
    /** 原始文件名 */
    fileName: varchar('file_name', { length: 255 }).notNull(),
    /** 存储路径/对象键，如 avatar/2024/01/abc.jpg */
    fileKey: varchar('file_key', { length: 500 }).notNull(),
    /** 文件大小（字节） */
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    /** MIME 类型，如 image/png */
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    /** 存储提供商：local / s3 / oss / cos / r2 */
    storageProvider: varchar('storage_provider', { length: 20 }).notNull(),
    /** 文件分组：avatar / document / photo / report */
    groupName: varchar('group_name', { length: 50 }).notNull(),
    /** 关联业务 ID（如项目 ID、工单 ID） */
    bizId: varchar('biz_id', { length: 100 }),
    /** 上传用户 */
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    /** 软删除时间，非空表示已删除 */
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('sys_file_user_idx').on(table.userId),
    index('sys_file_group_idx').on(table.groupName),
    index('sys_file_biz_idx').on(table.bizId),
    index('sys_file_provider_idx').on(table.storageProvider),
  ],
);

export const sysFileRelations = relations(sysFile, ({ one }) => ({
  user: one(user, {
    fields: [sysFile.userId],
    references: [user.id],
  }),
}));
