export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface AvatarUploadUrlRequest {
  file_name: string;
  content_type: string;
  file_size: number;
}

export interface AvatarUploadUrlResponse {
  upload_id: string;
  upload_url: string;
  headers?: Record<string, string>;
}

export interface AvatarConfirmResponse {
  file_name: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
  avatar_url: string;
  expires_in: number;
}

// Codes, not copy: the profile page turns them into Profile.avatarErrors.* in the
// active locale.
export type AvatarErrorCode = 'invalidType' | 'tooLarge' | 'uploadFailed';

export class AvatarUploadError extends Error {
  readonly code: AvatarErrorCode;

  constructor(code: AvatarErrorCode) {
    super(code);
    this.name = 'AvatarUploadError';
    this.code = code;
  }
}

export function validateAvatarFile(file: File): AvatarErrorCode | null {
  if (!allowedAvatarTypes.has(file.type)) return 'invalidType';
  if (file.size > MAX_AVATAR_SIZE) return 'tooLarge';
  return null;
}
