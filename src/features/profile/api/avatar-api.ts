import { apiClient } from '@/lib/api-client';
import { getProfileAuthHeaders } from './profile-auth';
import type {
  AvatarConfirmResponse,
  AvatarUploadUrlRequest,
  AvatarUploadUrlResponse,
} from '../schemas/avatar.schema';

export function requestAvatarUploadUrl(
  payload: AvatarUploadUrlRequest
): Promise<AvatarUploadUrlResponse> {
  return apiClient<AvatarUploadUrlResponse>('/profile/avatar/upload-url', {
    method: 'POST',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatarToS3(
  uploadUrl: string,
  file: File,
  headers?: Record<string, string>
): Promise<void> {
  const s3Headers = { ...headers };
  delete s3Headers.Authorization;
  delete s3Headers.authorization;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: s3Headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error('تعذر رفع الصورة. يرجى المحاولة مرة أخرى.');
  }
}

export function confirmAvatarUpload(uploadId: string): Promise<AvatarConfirmResponse> {
  return apiClient<AvatarConfirmResponse>('/profile/avatar/confirm', {
    method: 'POST',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify({ upload_id: uploadId }),
  });
}
