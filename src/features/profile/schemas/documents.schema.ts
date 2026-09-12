export type UploadStatus = 'NOT_UPLOADED' | 'UPLOADING' | 'UPLOADED' | 'FAILED';

export interface Document {
  id: string | null;
  document_type: string | null;
  file_name: string | null;
  content_type: string | null;
  file_size: number | null;
  status: UploadStatus;
  uploaded_at: string | null;
}

export type UploadedFile = Document;

export interface DocumentsApi {
  cv: Document;
  transcript: Document;
  graduation_certificate: Document;
  passport: Document;
  recommendation_letters: Document[];
  english_test: Document;
  university_admission_letter: Document;
}

export const createEmptyDocument = (documentType: string | null = null): Document => ({
  id: null,
  document_type: documentType,
  file_name: null,
  content_type: null,
  file_size: null,
  status: 'NOT_UPLOADED',
  uploaded_at: null,
});

export const emptyDocuments: DocumentsApi = {
  cv: createEmptyDocument('cv'),
  transcript: createEmptyDocument('transcript'),
  graduation_certificate: createEmptyDocument('graduation_certificate'),
  passport: createEmptyDocument('passport'),
  recommendation_letters: [],
  english_test: createEmptyDocument('english_test'),
  university_admission_letter: createEmptyDocument('university_admission_letter'),
};

export interface UploadUrlRequestPayload {
  document_type: string;
  file_name: string;
  content_type: string;
  file_size: number;
}

export interface UploadUrlResponse {
  upload_id: string;
  upload_url: string;
  headers?: Record<string, string>;
  expires_in?: number;
}

export interface ConfirmUploadPayload {
  upload_id: string;
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_in?: number;
}

export interface DocumentUploadRule {
  maxSizeMB: number;
  extensions: string[];
  mimeTypes: string[];
}

export const MB_TO_BYTES = (mb: number): number => mb * 1024 * 1024;

const PDF_MIME_TYPES = [
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'application/x-acrobat',
  'applications/vnd.pdf',
  'text/pdf',
];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'];

const WORD_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/x-msword',
];

export const DOCUMENT_UPLOAD_RULES: Record<string, DocumentUploadRule> = {
  cv: {
    maxSizeMB: 5,
    extensions: ['.pdf', '.docx'],
    mimeTypes: [...PDF_MIME_TYPES, ...WORD_MIME_TYPES],
  },
  motivation_letter: {
    maxSizeMB: 5,
    extensions: ['.pdf', '.docx'],
    mimeTypes: [...PDF_MIME_TYPES, ...WORD_MIME_TYPES],
  },
  transcript: {
    maxSizeMB: 10,
    extensions: ['.pdf'],
    mimeTypes: [...PDF_MIME_TYPES],
  },
  graduation_certificate: {
    maxSizeMB: 10,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    mimeTypes: [...PDF_MIME_TYPES, ...IMAGE_MIME_TYPES],
  },
  passport: {
    maxSizeMB: 5,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    mimeTypes: [...PDF_MIME_TYPES, ...IMAGE_MIME_TYPES],
  },
  recommendation_letter: {
    maxSizeMB: 5,
    extensions: ['.pdf', '.docx'],
    mimeTypes: [...PDF_MIME_TYPES, ...WORD_MIME_TYPES],
  },
  recommendation_letters: {
    maxSizeMB: 5,
    extensions: ['.pdf', '.docx'],
    mimeTypes: [...PDF_MIME_TYPES, ...WORD_MIME_TYPES],
  },
  english_test: {
    maxSizeMB: 5,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    mimeTypes: [...PDF_MIME_TYPES, ...IMAGE_MIME_TYPES],
  },
  university_admission_letter: {
    maxSizeMB: 10,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    mimeTypes: [...PDF_MIME_TYPES, ...IMAGE_MIME_TYPES],
  },
};

export type FileValidationReason = 'NO_FILE' | 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE';

export type FileValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason: FileValidationReason;
      message: string;
    };

export function getAcceptAttribute(documentType: string): string {
  const rule = DOCUMENT_UPLOAD_RULES[documentType] || DOCUMENT_UPLOAD_RULES.cv;
  const combined = [...rule.extensions, ...rule.mimeTypes];
  return combined.join(',');
}

export const ALLOWED_DOCUMENT_TYPES: Record<
  string,
  { mimeTypes: string[]; extensions: string[]; acceptString: string }
> = Object.fromEntries(
  Object.entries(DOCUMENT_UPLOAD_RULES).map(([key, rule]) => [
    key,
    {
      mimeTypes: rule.mimeTypes,
      extensions: rule.extensions,
      acceptString: getAcceptAttribute(key),
    },
  ])
);

export function formatAllowedExtensionsLabel(extensions: string[], isArabic: boolean): string {
  const formatted = extensions.map((ext) => ext.replace('.', '').toUpperCase());
  if (formatted.length <= 1) return formatted.join('');
  const separator = isArabic ? ' أو ' : ' or ';
  if (formatted.length === 2) {
    return formatted.join(separator);
  }
  return formatted.slice(0, -1).join(', ') + separator + formatted[formatted.length - 1];
}

export function formatDocumentRequirementText(
  documentType: string,
  translator?: (key: string, params?: Record<string, string | number>) => string,
  locale?: string
): string {
  const rule = DOCUMENT_UPLOAD_RULES[documentType] || DOCUMENT_UPLOAD_RULES.cv;
  const isArabic =
    locale === 'ar' ||
    (typeof translator === 'function' && translator('title') === 'الوثائق الرسمية');

  const formatsLabel = formatAllowedExtensionsLabel(rule.extensions, isArabic);
  const maxSizeLabel = `${rule.maxSizeMB} MB`;

  if (typeof translator === 'function') {
    return translator('fileRequirement', {
      formats: formatsLabel,
      maxSize: maxSizeLabel,
    });
  }

  return isArabic
    ? `${formatsLabel} — الحد الأقصى ${maxSizeLabel}`
    : `${formatsLabel} — Max ${maxSizeLabel}`;
}

export function validateDocumentFile(
  documentType: string,
  file?: { name: string; type: string; size: number } | File | null,
  translator?: (key: string, params?: Record<string, string | number>) => string
): FileValidationResult {
  if (!file) {
    const defaultMsg =
      typeof translator === 'function' ? translator('noFile') : 'لم يتم اختيار أي ملف.';
    return {
      valid: false,
      reason: 'NO_FILE',
      message: defaultMsg,
    };
  }

  const rule = DOCUMENT_UPLOAD_RULES[documentType] || DOCUMENT_UPLOAD_RULES.cv;
  const maxSizeBytes = MB_TO_BYTES(rule.maxSizeMB);

  if (file.size > maxSizeBytes) {
    const defaultMsg =
      typeof translator === 'function'
        ? translator('fileTooLarge', { maxSize: `${rule.maxSizeMB} MB` })
        : `حجم الملف أكبر من الحد المسموح وهو ${rule.maxSizeMB} MB.`;
    return {
      valid: false,
      reason: 'FILE_TOO_LARGE',
      message: defaultMsg,
    };
  }

  const rawFileName = (file.name || '').trim();
  const rawExt = rawFileName.includes('.')
    ? rawFileName.split('.').pop()?.trim().toLowerCase()
    : '';
  const ext = rawExt ? '.' + rawExt : '';
  const allowedExtensions = rule.extensions.map((e) => e.trim().toLowerCase());
  const isExtAllowed = ext !== '' && allowedExtensions.includes(ext);

  if (!isExtAllowed) {
    const formattedFormats = rule.extensions
      .map((e) => e.replace('.', '').toUpperCase())
      .join(', ');
    const defaultMsg =
      typeof translator === 'function'
        ? translator('invalidFileType', { formats: formattedFormats })
        : `نوع الملف غير مدعوم. الصيغ المسموحة: ${formattedFormats}.`;
    return {
      valid: false,
      reason: 'INVALID_FILE_TYPE',
      message: defaultMsg,
    };
  }

  const rawMimeType = (file.type || '').trim().toLowerCase();
  const mimeType = rawMimeType.split(';')[0].trim();
  if (mimeType !== '') {
    const allowedMimes = rule.mimeTypes.map((m) => m.trim().toLowerCase());
    const isMimeAllowed = allowedMimes.includes(mimeType);

    const isGenericMime =
      mimeType === 'application/octet-stream' || mimeType === 'application/x-unknown-content-type';

    if (!isMimeAllowed && !isGenericMime) {
      const formattedFormats = rule.extensions
        .map((e) => e.replace('.', '').toUpperCase())
        .join(', ');
      const defaultMsg =
        typeof translator === 'function'
          ? translator('invalidFileType', { formats: formattedFormats })
          : `نوع الملف غير مدعوم. الصيغ المسموحة: ${formattedFormats}.`;
      return {
        valid: false,
        reason: 'INVALID_FILE_TYPE',
        message: defaultMsg,
      };
    }
  }

  return { valid: true };
}
