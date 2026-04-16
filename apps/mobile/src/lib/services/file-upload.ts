/**
 * File Upload Service
 *
 * 使用预签名 URL 实现客户端直传存储服务：
 * 1. getUploadUrl - 获取预签名 URL 和 fileId
 * 2. 客户端直接 PUT 到预签名 URL
 * 3. confirmUpload - 确认上传完成
 *
 * 优势：
 * - 大文件不走服务器内存
 * - 更高并发能力
 * - 更好性能（直传 R2/S3）
 */
import { trpcVanilla } from '@/lib/trpc-vanilla';
import { guessMimeType, guessFileName, isRetryableError, isOfflineError } from './file-upload-utils';

// ==================== Types ====================

export interface FileUploadOptions {
  /** 本地文件 URI（file:// 或 content://） */
  uri: string;
  /** 文件分组（avatar, document, photo, report 等） */
  groupName: string;
  /** 业务关联 ID（可选） */
  bizId?: string;
  /** 自定义文件名（可选，默认从 URI 推断） */
  fileName?: string;
  /** 自定义 MIME 类型（可选，默认从扩展名推断） */
  mimeType?: string;
}

export interface FileUploadResult {
  id: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  groupName: string;
}

export interface UploadWithRetryOptions extends FileUploadOptions {
  /** 最大重试次数（默认 3） */
  maxAttempts?: number;
  /** 离线时是否返回本地 URI 而非抛错（默认 false） */
  offlineFallback?: boolean;
}

// ==================== Core Upload ====================

/**
 * 获取文件大小
 *
 * 使用 fetch HEAD 请求获取 Content-Length，或默认为 0
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    const response = await fetch(uri, { method: 'HEAD' });
    const contentLength = response.headers.get('Content-Length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    // 无法获取大小，返回 0（后端会验证）
    return 0;
  }
}

/**
 * 单次上传文件（预签名 URL 直传）
 */
export async function uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
  const fileName = options.fileName ?? guessFileName(options.uri);
  const mimeType = options.mimeType ?? guessMimeType(options.uri);
  const fileSize = await getFileSize(options.uri);

  // Step 1: 获取预签名 URL
  const uploadUrlResult = await trpcVanilla.file.getUploadUrl.mutate({
    fileName,
    mimeType,
    fileSize,
    groupName: options.groupName,
    bizId: options.bizId,
  });

  // Step 2: 直接上传到预签名 URL (PUT)
  const fileResponse = await fetch(options.uri);
  const fileBlob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => '');
    throw new Error(`Upload to storage failed (${uploadResponse.status}): ${text}`);
  }

  // Step 3: 确认上传完成
  const fileResult = await trpcVanilla.file.confirmUpload.mutate({
    fileId: uploadUrlResult.fileId,
    fileKey: uploadUrlResult.fileKey,
  });

  return {
    id: fileResult.id,
    fileName: fileResult.fileName,
    fileKey: fileResult.fileKey,
    fileUrl: fileResult.fileUrl,
    fileSize: fileResult.fileSize,
    mimeType: fileResult.mimeType,
    groupName: fileResult.groupName,
  };
}

/**
 * 带重试和离线降级的文件上传
 *
 * @returns FileUploadResult, 或在离线 fallback 模式下返回 null（此时调用方应使用本地 URI）
 */
export async function uploadFileWithRetry(
  options: UploadWithRetryOptions,
): Promise<FileUploadResult | null> {
  const { maxAttempts = 3, offlineFallback = false, ...uploadOptions } = options;
  const trimmedUri = uploadOptions.uri.trim();

  if (!trimmedUri) {
    throw new Error('File URI is required');
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadFile({ ...uploadOptions, uri: trimmedUri });
    } catch (error) {
      lastError = error;

      if (isOfflineError(error) && offlineFallback) {
        console.warn('[FileUpload] Offline, skipping upload');
        return null;
      }

      if (!isRetryableError(error) || attempt === maxAttempts) {
        break;
      }

      // Backoff: 150ms, 300ms, 450ms...
      await new Promise((resolve) => setTimeout(resolve, attempt * 150));
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : 'Unable to upload file right now.';
  throw new Error(message);
}

// Re-export utilities
export { guessMimeType, guessFileName, isRetryableError, isOfflineError };