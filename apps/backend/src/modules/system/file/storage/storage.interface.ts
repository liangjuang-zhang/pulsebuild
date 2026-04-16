/**
 * 存储提供商接口
 *
 * 所有存储后端（local / s3 / oss / cos / r2）都需实现此接口。
 * 通过 Strategy 模式在运行时切换存储实现。
 */
export interface StorageProvider {
  /** 提供商标识，需与数据库 storage_provider 字段值对应 */
  readonly name: string;

  /** 上传文件，返回存储键 */
  upload(input: UploadInput): Promise<UploadResult>;

  /** 删除文件（硬删除存储） */
  delete(fileKey: string): Promise<void>;

  /** 生成文件访问 URL */
  getUrl(fileKey: string): string;

  /** 检查文件是否存在 */
  exists(fileKey: string): Promise<boolean>;

  /** 生成预签名上传 URL（客户端直传） */
  getPresignedUploadUrl(input: PresignedUploadInput): Promise<PresignedUploadResult>;
}

export interface UploadInput {
  /** 文件内容 */
  buffer: Buffer;
  /** 存储路径/键，如 avatar/2024/01/abc.jpg */
  fileKey: string;
  /** MIME 类型 */
  mimeType: string;
}

export interface UploadResult {
  /** 最终存储键（可能被 provider 修改） */
  fileKey: string;
  /** 文件大小（字节） */
  fileSize: number;
}

export interface PresignedUploadInput {
  /** 存储路径/键 */
  fileKey: string;
  /** MIME 类型 */
  mimeType: string;
  /** 预签名 URL 有效期（秒），默认 3600 */
  expiresIn?: number;
}

export interface PresignedUploadResult {
  /** 预签名上传 URL */
  uploadUrl: string;
  /** 存储键 */
  fileKey: string;
  /** URL 有效期（秒） */
  expiresIn: number;
}

/** 存储提供商 DI Token */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
