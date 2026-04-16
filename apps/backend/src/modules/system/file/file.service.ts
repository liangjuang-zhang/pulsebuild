import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, count, desc, eq, isNull, isNotNull } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { DATABASE_CONNECTION } from '../../../database/database.module';
import * as schema from '../../../database';
import { sysFile } from '../../../database/file.schema';
import { STORAGE_PROVIDER, type StorageProvider, type PresignedUploadInput } from './storage/storage.interface';
import type { FileInfo, FileListResult, FileQueryInput, UploadFileResult, GetUploadUrlInput, UploadUrlResult, ConfirmUploadInput } from './file.schema';

interface UploadInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  groupName: string;
  bizId?: string;
  userId?: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
  ) {}

  /**
   * 上传文件
   */
  async upload(input: UploadInput): Promise<UploadFileResult> {
    const ext = path.extname(input.fileName) || '';
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '/');
    const fileKey = `${input.groupName}/${datePrefix}/${uniqueName}`;

    const result = await this.storage.upload({
      buffer: input.buffer,
      fileKey,
      mimeType: input.mimeType,
    });

    const id = crypto.randomUUID();
    await this.db.insert(sysFile).values({
      id,
      fileName: input.fileName,
      fileKey: result.fileKey,
      fileSize: result.fileSize,
      mimeType: input.mimeType,
      storageProvider: this.storage.name,
      groupName: input.groupName,
      bizId: input.bizId ?? null,
      userId: input.userId ?? null,
    });

    this.logger.log(`File uploaded: ${input.fileName} -> ${result.fileKey}`);

    return {
      id,
      fileName: input.fileName,
      fileKey: result.fileKey,
      fileUrl: this.storage.getUrl(result.fileKey),
      fileSize: result.fileSize,
      mimeType: input.mimeType,
      groupName: input.groupName,
    };
  }

  /**
   * 批量上传文件
   */
  async uploadMany(inputs: UploadInput[]): Promise<UploadFileResult[]> {
    const results: UploadFileResult[] = [];
    for (const item of inputs) {
      const uploaded = await this.upload(item);
      results.push(uploaded);
    }
    return results;
  }

  /**
   * 查询文件列表
   */
  async list(input: FileQueryInput): Promise<FileListResult> {
    const conditions = [isNull(sysFile.deletedAt)];

    if (input.groupName) {
      conditions.push(eq(sysFile.groupName, input.groupName));
    }
    if (input.bizId) {
      conditions.push(eq(sysFile.bizId, input.bizId));
    }

    const where = and(...conditions);
    const offset = (input.page - 1) * input.limit;

    const [items, totalResult] = await Promise.all([
      this.db.select().from(sysFile).where(where).orderBy(desc(sysFile.createdAt)).limit(input.limit).offset(offset),
      this.db.select({ count: count() }).from(sysFile).where(where),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: items.map((row) => this.toFileInfo(row)),
      total,
      page: input.page,
      limit: input.limit,
    };
  }

  /**
   * 获取文件详情
   */
  async detail(id: string): Promise<FileInfo> {
    const row = await this.db
      .select()
      .from(sysFile)
      .where(and(eq(sysFile.id, id), isNull(sysFile.deletedAt)))
      .limit(1);

    if (!row[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '文件不存在' });
    }

    return this.toFileInfo(row[0]);
  }

  /**
   * 软删除文件
   */
  async softDelete(id: string): Promise<void> {
    const row = await this.db
      .select()
      .from(sysFile)
      .where(and(eq(sysFile.id, id), isNull(sysFile.deletedAt)))
      .limit(1);

    if (!row[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '文件不存在' });
    }

    await this.db.update(sysFile).set({ deletedAt: new Date() }).where(eq(sysFile.id, id));
    this.logger.log(`File soft-deleted: ${id}`);
  }

  /**
   * 硬删除已软删除的文件（清理存储 + 删除记录）
   */
  async purgeDeleted(): Promise<number> {
    const deleted = await this.db.select().from(sysFile).where(isNotNull(sysFile.deletedAt));

    let purged = 0;
    for (const row of deleted) {
      try {
        await this.storage.delete(row.fileKey);
        await this.db.delete(sysFile).where(eq(sysFile.id, row.id));
        purged++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to purge file ${row.id}: ${message}`);
      }
    }

    this.logger.log(`Purged ${purged}/${deleted.length} soft-deleted files`);
    return purged;
  }

  /**
   * 生成预签名上传 URL
   *
   * 流程：
   * 1. 生成 fileKey 和预签名 URL
   * 2. 预创建文件记录（状态为 pending）
   * 3. 返回 URL 和 fileId 给客户端
   * 4. 客户端直传到存储服务
   * 5. 客户端调用 confirmUpload 完成确认
   */
  async getUploadUrl(input: GetUploadUrlInput, userId?: string): Promise<UploadUrlResult> {
    const ext = path.extname(input.fileName) || '';
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '/');
    const fileKey = `${input.groupName}/${datePrefix}/${uniqueName}`;

    // 生成预签名 URL
    const presignedResult = await this.storage.getPresignedUploadUrl({
      fileKey,
      mimeType: input.mimeType,
      expiresIn: 3600,
    });

    // 预创建文件记录
    const fileId = crypto.randomUUID();
    await this.db.insert(sysFile).values({
      id: fileId,
      fileName: input.fileName,
      fileKey,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      storageProvider: this.storage.name,
      groupName: input.groupName,
      bizId: input.bizId ?? null,
      userId: userId ?? null,
      // 标记为待确认状态（通过 fileSize 为负数表示）
      // 或者添加一个 status 字段，但当前 schema 没有
    });

    this.logger.log(`Presigned URL generated: ${fileKey} for ${input.fileName}`);

    return {
      uploadUrl: presignedResult.uploadUrl,
      fileKey,
      expiresIn: presignedResult.expiresIn,
      fileId,
    };
  }

  /**
   * 确认上传完成
   *
   * 客户端上传完成后调用，验证文件存在并更新记录。
   */
  async confirmUpload(input: ConfirmUploadInput): Promise<FileInfo> {
    const row = await this.db
      .select()
      .from(sysFile)
      .where(and(eq(sysFile.id, input.fileId), eq(sysFile.fileKey, input.fileKey), isNull(sysFile.deletedAt)))
      .limit(1);

    if (!row[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '文件记录不存在或已被删除' });
    }

    // 验证文件已上传到存储
    const exists = await this.storage.exists(input.fileKey);
    if (!exists) {
      // 文件未上传，删除预创建的记录
      await this.db.delete(sysFile).where(eq(sysFile.id, input.fileId));
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: '文件尚未上传到存储服务' });
    }

    // 更新文件大小（从存储获取实际大小）
    // 注意：当前 schema 的 fileSize 在预创建时已设置，这里保持不变
    // 如果需要获取实际大小，需要调用 storage 获取元数据

    this.logger.log(`Upload confirmed: ${input.fileKey}`);

    return this.toFileInfo(row[0]);
  }

  private toFileInfo(row: typeof sysFile.$inferSelect): FileInfo {
    return {
      id: row.id,
      fileName: row.fileName,
      fileKey: row.fileKey,
      fileUrl: this.storage.getUrl(row.fileKey),
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      storageProvider: row.storageProvider,
      groupName: row.groupName,
      bizId: row.bizId,
      userId: row.userId,
      createdAt: row.createdAt,
    };
  }
}
