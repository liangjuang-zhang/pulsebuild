import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StorageProvider, UploadInput, UploadResult } from './storage.interface';

/**
 * 本地文件存储实现（开发环境）
 *
 * 文件存储在 ./uploads 目录下，通过静态文件服务提供访问。
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const port = this.configService.get<string>('PORT', '3000');
    this.baseUrl = this.configService.get<string>('UPLOAD_BASE_URL', `http://localhost:${port}/uploads`);
    this.ensureDir(this.uploadDir);
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const fullPath = path.join(this.uploadDir, input.fileKey);
    this.ensureDir(path.dirname(fullPath));
    await fs.promises.writeFile(fullPath, input.buffer);
    this.logger.log(`File uploaded: ${input.fileKey} (${input.buffer.length} bytes)`);

    return {
      fileKey: input.fileKey,
      fileSize: input.buffer.length,
    };
  }

  async delete(fileKey: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, fileKey);
    try {
      await fs.promises.unlink(fullPath);
      this.logger.log(`File deleted: ${fileKey}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`File not found for deletion: ${fileKey}`);
    }
  }

  getUrl(fileKey: string): string {
    return `${this.baseUrl}/${fileKey}`;
  }

  async exists(fileKey: string): Promise<boolean> {
    const fullPath = path.join(this.uploadDir, fileKey);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
