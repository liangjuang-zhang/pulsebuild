import { z } from 'zod';

// ==================== 输出类型 ====================

/** 文件信息 */
export const FileInfoSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileKey: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  storageProvider: z.string(),
  groupName: z.string(),
  bizId: z.string().nullable(),
  userId: z.string().nullable(),
  createdAt: z.date(),
});
export type FileInfo = z.infer<typeof FileInfoSchema>;

/** 上传结果 */
export const UploadFileResultSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileKey: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  groupName: z.string(),
});
export type UploadFileResult = z.infer<typeof UploadFileResultSchema>;

/** 多文件上传结果 */
export const UploadManyFileResultSchema = z.object({
  items: z.array(UploadFileResultSchema),
  total: z.number(),
});
export type UploadManyFileResult = z.infer<typeof UploadManyFileResultSchema>;

// ==================== 输入类型 ====================

/** 文件查询参数 */
export const FileQueryInputSchema = z.object({
  groupName: z.string().optional(),
  bizId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type FileQueryInput = z.infer<typeof FileQueryInputSchema>;

/** 文件删除参数 */
export const FileDeleteInputSchema = z.object({
  id: z.string().min(1),
});
export type FileDeleteInput = z.infer<typeof FileDeleteInputSchema>;

/** 文件详情参数 */
export const FileDetailInputSchema = z.object({
  id: z.string().min(1),
});
export type FileDetailInput = z.infer<typeof FileDetailInputSchema>;

// ==================== 分页结果 ====================

/** 分页文件列表 */
export const FileListResultSchema = z.object({
  items: z.array(FileInfoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type FileListResult = z.infer<typeof FileListResultSchema>;
