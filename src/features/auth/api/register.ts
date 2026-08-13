import { apiClient } from '@/lib/api-client';
import { type RegisterFormData } from '../schemas/create-register.schema';

type UserResponse = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
};

export async function register(credentials: RegisterFormData): Promise<UserResponse> {
  const payload = {
    email: credentials.email,
    password: credentials.password,
    // name: credentials.name
  };

  return apiClient<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
