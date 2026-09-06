'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { ProfileFormActions } from '@/components/profile/ProfileFormActions';
import { ProfileSaveContinueButton } from '@/components/profile/ProfileSaveContinueButton';
import { ApiError } from '@/lib/api-client';
import { useDeleteDocument, useDocuments } from '../hooks/useDocuments';
import { DocumentUploadRow } from './DocumentUploadRow';
import { createEmptyDocument, type Document } from '../schemas/documents.schema';

type Props = {
  onSavedNext?: () => void;
};

export function DocumentsSection({ onSavedNext }: Props) {
  const t = useTranslations('Documents');
  const documentsQuery = useDocuments();
  const deleteMutation = useDeleteDocument();

  const documents = documentsQuery.data;

  // Track active uploads per slot
  const [uploadingSlots, setUploadingSlots] = useState<Set<string>>(new Set());

  // Delete modal state
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    slotKey: string;
    name: string;
  } | null>(null);

  const authError = [documentsQuery.error, deleteMutation.error].some(
    (error) => error instanceof ApiError && (error.status === 401 || error.status === 403)
  );

  const documentTypes = useMemo(() => {
    return [
      { id: 'cv', key: 'cv', documentType: 'cv' },
      {
        id: 'graduation_certificate',
        key: 'graduation_certificate',
        documentType: 'graduation_certificate',
      },
      { id: 'transcript', key: 'transcript', documentType: 'transcript' },
      { id: 'english_test', key: 'english_test', documentType: 'english_test' },
      { id: 'passport', key: 'passport', documentType: 'passport' },
    ] as const;
  }, []);

  function handleUploadStart(slotId: string) {
    setUploadingSlots((prev) => new Set(prev).add(slotId));
  }

  function handleUploadEnd(slotId: string) {
    setUploadingSlots((prev) => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });
  }

  function handleRequestDelete(documentId: string, slotKey: string, name: string) {
    setDocumentToDelete({ id: documentId, slotKey, name });
  }

  function confirmDelete() {
    if (!documentToDelete) return;
    deleteMutation.mutate(
      { documentId: documentToDelete.id, slotKey: documentToDelete.slotKey },
      {
        onSettled: () => {
          setDocumentToDelete(null);
        },
      }
    );
  }

  // Calculate local section completion percentage
  const completionValue = useMemo(() => {
    if (!documents) return 0;
    const required = documentTypes
      .map(
        (d) =>
          documents[d.key as keyof typeof documents] &&
          (documents[d.key as keyof typeof documents] as Document).status === 'UPLOADED'
      )
      .filter(Boolean).length;
    const totalSlots = documentTypes.length;
    return Math.round((required / totalSlots) * 100);
  }, [documents, documentTypes]);

  // Active uploads count
  const isAnyUploading = uploadingSlots.size > 0;

  // Recommendation letters calculation
  const confirmedRecs = useMemo(() => {
    return documents?.recommendation_letters || [];
  }, [documents]);

  const uploadingRecsCount = useMemo(() => {
    return Array.from(uploadingSlots).filter((s) => s.startsWith('recommendation_letter')).length;
  }, [uploadingSlots]);

  const totalRecsCount = confirmedRecs.length + uploadingRecsCount;
  const isMaxRecsReached = totalRecsCount >= 3;

  // Render confirmed recommendation letters plus one empty slot if total < 3
  const displayRecList = useMemo(() => {
    const list: Array<{ id: string; file: Document }> = confirmedRecs.map((doc, idx) => ({
      id: doc.id ? `rec-${doc.id}` : `rec-confirmed-${idx}`,
      file: doc,
    }));

    if (totalRecsCount < 3) {
      list.push({
        id: `recommendation_letter_slot_${confirmedRecs.length}`,
        file: createEmptyDocument('recommendation_letter'),
      });
    }

    return list;
  }, [confirmedRecs, totalRecsCount]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{t('title')}</h2>
          <div className="flex items-center gap-3 rounded-full bg-[var(--color-bg-subtle)] px-4 py-2">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {t('completion')}
            </span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]" dir="ltr">
              {completionValue}%
            </span>
          </div>
        </div>

        {authError ? (
          <p
            role="alert"
            className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]"
          >
            {t('authRequired')}{' '}
            <Link href="/login" className="font-bold underline">
              {t('login')}
            </Link>
          </p>
        ) : (
          (documentsQuery.isError || deleteMutation.isError) && (
            <div
              role="alert"
              className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]"
            >
              {documentsQuery.error instanceof ApiError
                ? documentsQuery.error.message
                : deleteMutation.error instanceof ApiError
                  ? deleteMutation.error.message
                  : t('saveError')}
              {documentsQuery.isError && (
                <button
                  type="button"
                  disabled={documentsQuery.isFetching}
                  onClick={() => void documentsQuery.refetch()}
                  className="mx-2 font-bold underline"
                >
                  Retry
                </button>
              )}
            </div>
          )
        )}

        {documentsQuery.isPending ? (
          <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Standard Documents */}
            {documentTypes.map(({ id, key, documentType }) => {
              const fileData = documents?.[key as keyof typeof documents] as Document | undefined;
              const isCv = key === 'cv';

              return (
                <DocumentUploadRow
                  key={id}
                  id={id}
                  documentType={documentType}
                  title={t(`documentTypes.${id}`)}
                  subtitle={t('uploadMissing')}
                  file={fileData || createEmptyDocument(documentType)}
                  showImproveAi={isCv}
                  disabled={authError}
                  onUploadStart={handleUploadStart}
                  onUploadEnd={handleUploadEnd}
                  onRequestDelete={(docId, name) => handleRequestDelete(docId, key, name)}
                  isDeleting={deleteMutation.isPending}
                />
              );
            })}

            {/* Recommendation Letters */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {t('documentTypes.recommendation_letters')}
                </h3>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  ({confirmedRecs.length} / 3)
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {displayRecList.map((item, index) => (
                  <DocumentUploadRow
                    key={item.id}
                    id={item.id}
                    documentType="recommendation_letter"
                    title={`${t('documentTypes.recommendation_letters')} ${index + 1}`}
                    subtitle={t('uploadMissing')}
                    file={item.file}
                    disabled={authError || (isMaxRecsReached && !item.file.id)}
                    onUploadStart={handleUploadStart}
                    onUploadEnd={handleUploadEnd}
                    onRequestDelete={(docId, name) =>
                      handleRequestDelete(docId, 'recommendation_letter', name)
                    }
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <ProfileFormActions>
              <ProfileSaveContinueButton
                onClick={() => {
                  if (isAnyUploading) return;
                  if (typeof onSavedNext === 'function') {
                    onSavedNext();
                  }
                }}
                disabled={authError || isAnyUploading || deleteMutation.isPending}
                isLoading={false}
              />
            </ProfileFormActions>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        open={documentToDelete !== null}
        entityType="document"
        itemName={documentToDelete?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
      />
    </div>
  );
}
