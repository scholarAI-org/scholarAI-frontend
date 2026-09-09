import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  confirmDocumentUpload,
  deleteDocument,
  getDocumentDownloadUrl,
  requestDocumentUploadUrl,
  uploadFileToS3,
} from '../api/documents-api';
import { profileKeys } from '../query-keys';
import { useProfile } from './useProfile';
import {
  createEmptyDocument,
  emptyDocuments,
  validateDocumentFile,
  type Document,
} from '../schemas/documents.schema';
import type { FullProfileApi } from '../schemas/full-profile-api.schema';

export function useDocuments() {
  const { data, ...rest } = useProfile();
  return {
    ...rest,
    data: data.documents,
  };
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: async ({
      documentType,
      file,
    }: {
      documentType: string;
      file: File;
    }): Promise<{ documentType: string; savedDocument: Document }> => {
      // 1. Client file validation
      const validationResult = validateDocumentFile(documentType, file);
      if (!validationResult.valid) {
        throw new Error(validationResult.message);
      }

      // 2. Request presigned upload URL
      const uploadUrlRes = await requestDocumentUploadUrl({
        document_type: documentType,
        file_name: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      // 3. Direct S3 PUT (bypasses apiClient and Bearer headers)
      await uploadFileToS3(uploadUrlRes.upload_url, file, uploadUrlRes.headers);

      // 4. Confirm upload (sends upload_id only)
      const savedDocument = await confirmDocumentUpload(uploadUrlRes.upload_id);

      return { documentType, savedDocument };
    },
    onSuccess: ({ documentType, savedDocument }) => {
      // Patch GET /profile cache immediately
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        const currentDocs = old.documents || emptyDocuments;

        if (documentType === 'recommendation_letter' || documentType === 'recommendation_letters') {
          const recs = [...(currentDocs.recommendation_letters || [])];
          const existingIdx = savedDocument.id
            ? recs.findIndex((item) => item.id === savedDocument.id)
            : -1;

          if (existingIdx >= 0) {
            recs[existingIdx] = savedDocument;
          } else {
            recs.push(savedDocument);
          }

          return {
            ...old,
            documents: {
              ...currentDocs,
              recommendation_letters: recs,
            },
          };
        } else {
          return {
            ...old,
            documents: {
              ...currentDocs,
              [documentType]: savedDocument,
            },
          };
        }
      });

      // Invalidate GET /profile in background to reconcile with server truth
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: async ({
      documentId,
      slotKey,
    }: {
      documentId: string;
      slotKey: string;
    }): Promise<{ documentId: string; slotKey: string }> => {
      await deleteDocument(documentId);
      return { documentId, slotKey };
    },
    onSuccess: ({ documentId, slotKey }) => {
      // Patch GET /profile cache immediately after HTTP 204
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        const currentDocs = old.documents || emptyDocuments;

        if (slotKey === 'recommendation_letter' || slotKey === 'recommendation_letters') {
          return {
            ...old,
            documents: {
              ...currentDocs,
              recommendation_letters: (currentDocs.recommendation_letters || []).filter(
                (doc) => doc.id !== documentId
              ),
            },
          };
        } else {
          return {
            ...old,
            documents: {
              ...currentDocs,
              [slotKey]: createEmptyDocument(slotKey),
            },
          };
        }
      });

      // Invalidate GET /profile in background
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export async function triggerDocumentDownload(documentId: string): Promise<void> {
  if (!documentId) return;
  const res = await getDocumentDownloadUrl(documentId);
  if (res?.download_url) {
    const a = document.createElement('a');
    a.href = res.download_url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
