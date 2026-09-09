'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { DocumentIcon } from '@/components/icons/DocumentIcon';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api-client';
import { triggerDocumentDownload, useUploadDocument } from '../hooks/useDocuments';
import {
  formatDocumentRequirementText,
  getAcceptAttribute,
  validateDocumentFile,
  type Document,
} from '../schemas/documents.schema';

interface DocumentUploadRowProps {
  id: string;
  documentType: string;
  title: string;
  subtitle?: string;
  file: Document;
  showImproveAi?: boolean;
  disabled?: boolean;
  onUploadStart?: (id: string) => void;
  onUploadEnd?: (id: string) => void;
  onRequestDelete?: (documentId: string, name: string) => void;
  isDeleting?: boolean;
}

export function DocumentUploadRow({
  id,
  documentType,
  title,
  subtitle,
  file,
  showImproveAi = false,
  disabled = false,
  onUploadStart,
  onUploadEnd,
  onRequestDelete,
  isDeleting = false,
}: DocumentUploadRowProps) {
  const t = useTranslations('Documents');
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocument();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isUploaded = file.status === 'UPLOADED' && !!file.id;
  const isUploading = uploadMutation.isPending;

  const acceptAttribute = getAcceptAttribute(documentType);
  const requirementSubtitle = formatDocumentRequirementText(documentType, t);
  const displaySubtitle =
    subtitle && subtitle !== t('uploadMissing') ? subtitle : requirementSubtitle;

  function processSelectedFile(selectedFile: File) {
    setLocalError(null);

    // Client-side validation using shared validator
    const validationResult = validateDocumentFile(documentType, selectedFile, t);
    if (!validationResult.valid) {
      setLocalError(validationResult.message);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    onUploadStart?.(id);

    uploadMutation.mutate(
      { documentType, file: selectedFile },
      {
        onSuccess: () => {
          onUploadEnd?.(id);
        },
        onError: (error) => {
          onUploadEnd?.(id);
          if (error instanceof ApiError) {
            setLocalError(error.message);
          } else if (error instanceof Error) {
            setLocalError(error.message);
          } else {
            setLocalError(t('uploadError'));
          }
        },
      }
    );

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    processSelectedFile(selectedFile);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || isUploading || isDeleting) return;

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;

    processSelectedFile(droppedFile);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  async function handleDownload() {
    if (!file.id || isDownloading) return;
    try {
      setIsDownloading(true);
      await triggerDocumentDownload(file.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setLocalError(err.message);
      } else {
        setLocalError(t('saveError'));
      }
    } finally {
      setIsDownloading(false);
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4 bg-white transition-colors hover:border-[#1d4ed8]/30"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]">
          <DocumentIcon className="h-6 w-6" />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>

          {isUploaded ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--color-success)]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="truncate max-w-[200px] font-medium" dir="ltr">
                {file.file_name}
              </span>
              {file.file_size ? (
                <span className="text-xs text-[var(--color-text-secondary)]" dir="ltr">
                  ({formatFileSize(file.file_size)})
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{displaySubtitle}</p>
          )}

          {localError && (
            <p className="mt-1 text-sm font-medium text-[var(--color-text-error)]">{localError}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <input
          type="file"
          id={`file-upload-${id}`}
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || disabled || isDeleting}
          accept={acceptAttribute}
        />

        {isUploaded && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading || disabled || isDeleting}
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
              title={t('download')}
              aria-label={t('download')}
            >
              {isDownloading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestDelete?.(file.id!, file.file_name || title)}
              disabled={disabled || isDeleting || isUploading}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              title={t('delete')}
              aria-label={t('delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}

        {showImproveAi && (
          <Button
            variant="outline"
            className="text-[#1d4ed8] border-[#1d4ed8]/20 hover:bg-[#1d4ed8]/5 hidden sm:flex"
            disabled
            title="Coming soon"
          >
            {t('improveAIBtn')}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || disabled || isDeleting}
          className={
            isUploaded
              ? 'text-[var(--color-text-secondary)]'
              : 'text-[#1d4ed8] border-[#1d4ed8]/20 bg-[#1d4ed8]/5 hover:bg-[#1d4ed8]/10'
          }
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('uploading', { defaultValue: 'Uploading...' })}
            </span>
          ) : isUploaded ? (
            t('updateBtn')
          ) : (
            t('upload', { defaultValue: 'Upload' })
          )}
        </Button>
      </div>
    </div>
  );
}
