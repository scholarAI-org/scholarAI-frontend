import { apiClient } from '@/lib/api-client';
import type { LoginFormData } from '../schemas/login.schema';
import type { UserRole } from '../types';
// rememberMe خاصية إضافية محلية بس، مش جزء من LoginFormData (ما بتحتاج validation)
type LoginCredentials = LoginFormData & { rememberMe?: boolean };

export async function login(credentials: LoginCredentials): Promise<UserRole> {
  // rememberMe مش داخل body عن قصد — الباك اند بيتوقع email/password بس
  return apiClient<UserRole>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
}
