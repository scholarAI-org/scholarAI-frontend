import { apiClient } from '@/lib/api-client';
import { type RegisterFormData } from '../schemas/create-register.schema';

type RegisterResponse = {
  message: string;
};

export async function register(credentials: RegisterFormData): Promise<RegisterResponse> {
  const payload = {
    full_name: credentials.name,
    email: credentials.email,
    password: credentials.password,
    role: 'student',
  };

  return apiClient<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
