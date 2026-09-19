const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  details: Array<{ loc: (string | number)[]; msg: string }>;

  constructor(
    message: string,
    details: Array<{ loc: (string | number)[]; msg: string }> = [],
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = API_URL?.replace(/\/+$/, '') ?? '';
  const path = endpoint.replace(/^\/+/, '');

  const isFormData = options?.body instanceof FormData;
  const headers = { ...options?.headers } as Record<string, string>;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}/${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detail = errorData?.detail;
    // الباك اند بيرجع detail كـ string (مثلاً أخطاء 401/404) أو كـ array من {msg} (أخطاء 422 validation)
    const message = Array.isArray(detail)
      ? detail[0]?.msg
      : typeof detail === 'string'
        ? detail
        : null;
    throw new ApiError(
      message || 'error happen',
      Array.isArray(detail) ? detail : [],
      response.status
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
