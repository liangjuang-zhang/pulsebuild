import { Inject } from '@nestjs/common';
import { Mutation, Query, Router, UseMiddlewares, Input, Ctx } from 'nestjs-trpc';
import { z } from 'zod';
import { FileService } from './file.service';
import {
  FileDeleteInputSchema,
  FileDetailInputSchema,
  FileInfoSchema,
  FileListResultSchema,
  FileQueryInputSchema,
  GetUploadUrlInputSchema,
  UploadUrlResultSchema,
  ConfirmUploadInputSchema,
} from './file.schema';
import type { FileDeleteInput, FileDetailInput, FileQueryInput, GetUploadUrlInput, ConfirmUploadInput } from './file.schema';
import { AuthMiddleware, type AuthenticatedContext } from '../../auth/auth.middleware';
import { PermissionMiddleware } from '../../auth/permission.middleware';

/**
 * 文件管理 tRPC 路由
 *
 * 使用预签名 URL 实现客户端直传：
 * 1. getUploadUrl - 获取预签名 URL
 * 2. 客户端直接上传到 R2/S3
 * 3. confirmUpload - 确认上传完成
 */
@Router({ alias: 'file' })
@UseMiddlewares(AuthMiddleware, PermissionMiddleware)
export class FileRouter {
  constructor(@Inject(FileService) private readonly fileService: FileService) {}

  /** 获取预签名上传 URL */
  @Mutation({
    input: GetUploadUrlInputSchema,
    output: UploadUrlResultSchema,
  })
  async getUploadUrl(@Input() input: GetUploadUrlInput, @Ctx() ctx: AuthenticatedContext) {
    return this.fileService.getUploadUrl(input, ctx.userId);
  }

  /** 确认上传完成 */
  @Mutation({
    input: ConfirmUploadInputSchema,
    output: FileInfoSchema,
  })
  async confirmUpload(@Input() input: ConfirmUploadInput) {
    return this.fileService.confirmUpload(input);
  }

  /** 查询文件列表（分页） */
  @Query({
    input: FileQueryInputSchema,
    output: FileListResultSchema,
  })
  async list(@Input() input: FileQueryInput) {
    return this.fileService.list(input);
  }

  /** 获取文件详情 */
  @Query({
    input: FileDetailInputSchema,
    output: FileInfoSchema,
  })
  async detail(@Input() input: FileDetailInput) {
    return this.fileService.detail(input.id);
  }

  /** 软删除文件 */
  @Query({
    input: FileDeleteInputSchema,
    output: z.object({ success: z.boolean() }),
  })
  async remove(@Input() input: FileDeleteInput) {
    await this.fileService.softDelete(input.id);
    return { success: true };
  }
}
