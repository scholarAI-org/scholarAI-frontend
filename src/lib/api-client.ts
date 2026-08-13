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
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(errorData?.detail?.[0]?.msg || 'error happen', errorData?.detail || []);
  }
  return response.json() as Promise<T>;
}
