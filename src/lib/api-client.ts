const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL);
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
    throw new Error(errorData?.detail?.[0]?.msg || 'error happen');
  }
  return response.json() as Promise<T>;
}
