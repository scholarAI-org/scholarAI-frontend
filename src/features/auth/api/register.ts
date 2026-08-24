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
    full_name: credentials.name,
    email: credentials.email,
    password: credentials.password,
    role: 'student',
  };

  return apiClient<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
