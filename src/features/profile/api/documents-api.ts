import { apiClient } from '@/lib/api-client';
import { getProfileAuthHeaders } from './profile-auth';
import type {
  Document,
  DocumentsApi,
  DownloadUrlResponse,
  UploadUrlRequestPayload,
  UploadUrlResponse,
} from '../schemas/documents.schema';

export async function getDocuments(): Promise<DocumentsApi> {
  return apiClient<DocumentsApi>('/profile/documents', {
    method: 'GET',
    headers: getProfileAuthHeaders(),
  });
}

export async function requestDocumentUploadUrl(
  payload: UploadUrlRequestPayload
): Promise<UploadUrlResponse> {
  return apiClient<UploadUrlResponse>('/profile/documents/upload-url', {
    method: 'POST',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  headers?: Record<string, string>
): Promise<void> {
  const s3Headers: Record<string, string> = { ...headers };

  // Direct S3 PUT request must bypass apiClient and must never include Scholar AI Bearer token.
  delete s3Headers.Authorization;
  delete s3Headers.authorization;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: s3Headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed with status ${response.status}`);
  }
}

export async function confirmDocumentUpload(uploadId: string): Promise<Document> {
  return apiClient<Document>('/profile/documents/confirm', {
    method: 'POST',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify({ upload_id: uploadId }),
  });
}

export async function getDocumentDownloadUrl(documentId: string): Promise<DownloadUrlResponse> {
  return apiClient<DownloadUrlResponse>(`/profile/documents/${documentId}/download-url`, {
    method: 'GET',
    headers: getProfileAuthHeaders(),
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  return apiClient<void>(`/profile/documents/${documentId}`, {
    method: 'DELETE',
    headers: getProfileAuthHeaders(),
  });
}
