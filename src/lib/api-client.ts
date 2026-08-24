const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  details: Array<{ loc: (string | number)[]; msg: string }>;

  constructor(message: string, details: Array<{ loc: (string | number)[]; msg: string }> = []) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = API_URL?.replace(/\/+$/, '') ?? '';
  const path = endpoint.replace(/^\/+/, '');

  const response = await fetch(`${baseUrl}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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
    throw new ApiError(message || 'error happen', Array.isArray(detail) ? detail : []);
  }
  return response.json() as Promise<T>;
}
