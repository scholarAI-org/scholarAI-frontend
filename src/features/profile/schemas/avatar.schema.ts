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

export function validateAvatarFile(file: File): string | null {
  if (!allowedAvatarTypes.has(file.type)) {
    return 'يرجى اختيار صورة بصيغة JPEG أو PNG أو WebP.';
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return 'يجب ألا يتجاوز حجم الصورة 5 ميجابايت.';
  }
  return null;
}
