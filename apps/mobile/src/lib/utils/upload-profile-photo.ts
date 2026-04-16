/**
 * Profile Photo Upload
 *
 * 基于通用 file-upload 服务的头像上传快捷方法。
 */
import { uploadFileWithRetry } from '@/lib/services/file-upload';

/**
 * 上传头像，带重试和离线降级。
 *
 * @returns 远程 URL，离线时返回原始本地 URI。
 */
export async function uploadProfilePhoto(uri: string): Promise<string> {
  const result = await uploadFileWithRetry({
    uri,
    groupName: 'avatar',
    offlineFallback: true,
  });

  // null = 离线降级，返回本地 URI
  return result?.fileUrl ?? uri;
}
