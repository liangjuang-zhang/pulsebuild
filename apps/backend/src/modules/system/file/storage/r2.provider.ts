import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, UploadInput, UploadResult, PresignedUploadInput, PresignedUploadResult } from './storage.interface';

/**
 * Cloudflare R2 存储实现
 *
 * 使用 AWS S3 兼容 API 与 Cloudflare R2 交互。
 * 文件通过公共 URL 提供访问。
 */
@Injectable()
export class R2StorageProvider implements StorageProvider {
  readonly name = 'r2';
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('CLOUDFLARE_R2_ACCOUNT_ID');
    this.bucket = this.configService.getOrThrow<string>('CLOUDFLARE_R2_BUCKET');
    this.publicUrl = this.configService.getOrThrow<string>('CLOUDFLARE_R2_PUBLIC');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('CLOUDFLARE_R2_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow<string>('CLOUDFLARE_R2_ACCESS_SECRET'),
      },
    });
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.fileKey,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    this.logger.log(`File uploaded to R2: ${input.fileKey} (${input.buffer.length} bytes)`);

    return {
      fileKey: input.fileKey,
      fileSize: input.buffer.length,
    };
  }

  async delete(fileKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }));
    this.logger.log(`File deleted from R2: ${fileKey}`);
  }

  getUrl(fileKey: string): string {
    return `${this.publicUrl.replace(/\/$/, '')}/${fileKey}`;
  }

  async exists(fileKey: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: fileKey }));
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUploadUrl(input: PresignedUploadInput): Promise<PresignedUploadResult> {
    const expiresIn = input.expiresIn ?? 3600;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.fileKey,
      ContentType: input.mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    this.logger.log(`Generated presigned URL for: ${input.fileKey} (expires in ${expiresIn}s)`);

    return {
      uploadUrl,
      fileKey: input.fileKey,
      expiresIn,
    };
  }
}
