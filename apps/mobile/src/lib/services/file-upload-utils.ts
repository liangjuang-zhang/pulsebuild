/**
 * File Upload Utilities
 *
 * MIME 类型推断、文件名推断、错误分类等工具函数。
 */

// ==================== MIME / FileName 推断 ====================

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function guessMimeType(uri: string): string {
  const normalized = uri.toLowerCase();
  for (const [ext, mime] of Object.entries(MIME_MAP)) {
    if (normalized.endsWith(ext)) return mime;
  }
  return 'application/octet-stream';
}

export function guessFileName(uri: string, fallbackPrefix = 'upload'): string {
  const segment = uri.split('/').pop()?.split('?')[0]?.trim() ?? '';
  if (segment.length > 0 && segment.includes('.')) {
    return segment;
  }
  const mimeType = guessMimeType(uri);
  const ext = mimeType.split('/')[1] ?? 'bin';
  return `${fallbackPrefix}.${ext}`;
}

// ==================== Error Classification ====================

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}

export function isOfflineError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('no internet') ||
    msg.includes('network unreachable')
  );
}