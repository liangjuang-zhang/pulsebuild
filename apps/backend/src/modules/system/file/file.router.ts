import { Inject } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { Mutation, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import { FileService } from './file.service';
import { FileDeleteInputSchema, FileDetailInputSchema, FileInfoSchema, FileListResultSchema, FileQueryInputSchema, UploadFileResultSchema, UploadManyFileResultSchema } from './file.schema';
import type { FileDeleteInput, FileDetailInput, FileQueryInput } from './file.schema';

/**
 * 文件管理 tRPC 路由
 *
 * 提供文件上传、查询、详情、删除接口。
 * 所有接口需认证（全局 AuthGuard）。
 */
@Router({ alias: 'file' })
export class FileRouter {
  constructor(@Inject(FileService) private readonly fileService: FileService) {}

  private parseCommonMeta(input: FormData): { groupName: string; bizId?: string } {
    const groupNameEntry = input.get('groupName');
    if (typeof groupNameEntry !== 'string' || groupNameEntry.trim().length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'groupName 字段必填' });
    }

    const bizIdEntry = input.get('bizId');
    const bizId = typeof bizIdEntry === 'string' && bizIdEntry.trim().length > 0 ? bizIdEntry : undefined;

    return { groupName: groupNameEntry.trim(), bizId };
  }

  /**
   * 上传文件（FormData）
   *
   * FormData 字段约定：
   * - file: File
   * - groupName: string
   * - bizId?: string
   */
  @Mutation({
    input: z.instanceof(FormData),
    output: UploadFileResultSchema,
  })
  async upload(
    @Inject('input')
    input: FormData,
  ) {
    const { groupName, bizId } = this.parseCommonMeta(input);

    const fileEntry = input.get('file');
    if (!(fileEntry instanceof File)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'file 字段必须是文件' });
    }
    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    return this.fileService.upload({
      buffer,
      fileName: fileEntry.name || 'unnamed',
      mimeType: fileEntry.type || 'application/octet-stream',
      groupName,
      bizId,
    });
  }

  /**
   * 批量上传文件（FormData）
   *
   * FormData 字段约定：
   * - files: File[]
   * - groupName: string
   * - bizId?: string
   */
  @Mutation({
    input: z.instanceof(FormData),
    output: UploadManyFileResultSchema,
  })
  async uploadMany(
    @Inject('input')
    input: FormData,
  ) {
    const { groupName, bizId } = this.parseCommonMeta(input);

    const fileEntries = input.getAll('files').filter((entry): entry is File => entry instanceof File);
    if (fileEntries.length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'files 字段必须包含至少一个文件' });
    }

    const uploadInputs = await Promise.all(
      fileEntries.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        fileName: file.name || 'unnamed',
        mimeType: file.type || 'application/octet-stream',
        groupName,
        bizId,
      })),
    );

    const items = await this.fileService.uploadMany(uploadInputs);
    return {
      items,
      total: items.length,
    };
  }

  /**
   * 查询文件列表（分页）
   *
   * 支持按 groupName、bizId 过滤。
   */
  @Query({
    input: FileQueryInputSchema,
    output: FileListResultSchema,
  })
  async list(
    @Inject('input')
    input: FileQueryInput,
  ) {
    return this.fileService.list(input);
  }

  /**
   * 获取文件详情
   */
  @Query({
    input: FileDetailInputSchema,
    output: FileInfoSchema,
  })
  async detail(
    @Inject('input')
    input: FileDetailInput,
  ) {
    return this.fileService.detail(input.id);
  }

  /**
   * 软删除文件
   */
  @Query({
    input: FileDeleteInputSchema,
    output: z.object({ success: z.boolean() }),
  })
  async remove(
    @Inject('input')
    input: FileDeleteInput,
  ) {
    await this.fileService.softDelete(input.id);
    return { success: true };
  }
}
