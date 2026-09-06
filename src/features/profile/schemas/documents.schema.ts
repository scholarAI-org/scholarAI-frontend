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

export const ALLOWED_DOCUMENT_TYPES: Record<
  string,
  { mimeTypes: string[]; extensions: string[]; acceptString: string }
> = {
  cv: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    acceptString: '.pdf,application/pdf',
  },
  transcript: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    acceptString: '.pdf,application/pdf',
  },
  graduation_certificate: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    acceptString: '.pdf,application/pdf',
  },
  recommendation_letter: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    acceptString: '.pdf,application/pdf',
  },
  passport: {
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    acceptString: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
  },
  english_test: {
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    acceptString: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
  },
};

export function validateDocumentFile(documentType: string, file: File): string | null {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB = 10485760 bytes
  if (file.size > MAX_SIZE) {
    return 'حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت).';
  }

  if (!file.type || file.type.trim() === '') {
    return 'نوع الملف غير مدعوم. يرجى اختيار ملف صالحة.';
  }

  const spec = ALLOWED_DOCUMENT_TYPES[documentType];
  if (spec) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeAllowed = spec.mimeTypes.includes(file.type.toLowerCase());
    const isExtAllowed = spec.extensions.includes(ext);

    if (!isMimeAllowed || !isExtAllowed) {
      return `نوع الملف غير مدعوم. الأنواع المسموحة: ${spec.extensions.join(', ')}`;
    }
  }

  return null;
}
