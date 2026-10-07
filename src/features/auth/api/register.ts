import { apiClient } from '@/lib/api-client';
import { type RegisterFormData } from '../schemas/create-register.schema';

type RegisterResponse = {
  message: string;
};

export async function register(credentials: RegisterFormData): Promise<RegisterResponse> {
  // Backend UserCreate schema is additionalProperties:false — only
  // full_name, email and password are accepted. Role is server-assigned.
  const payload = {
    full_name: credentials.name,
    email: credentials.email,
    password: credentials.password,
  };

  return apiClient<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
