'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRegister } from '../hooks/useRegister';
import { createRegisterSchema, type RegisterFormData } from '../schemas/create-register.schema';
import { ApiError } from '@/lib/api-client';

export function RegisterForm() {
  const t = useTranslations('Register');
  const { mutate, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(t)),
  });

  function onSubmit(data: RegisterFormData) {
    mutate(data, {
      onError: (error) => {
        if (error instanceof ApiError) {
          error.details.forEach((detail) => {
            const fieldName = detail.loc[detail.loc.length - 1] as keyof RegisterFormData;
            setError(fieldName, { message: detail.msg });
          });
        }
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input type="text" placeholder={t('name')} {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      <div>
        <input type="email" placeholder={t('email')} {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input type="password" placeholder={t('password')} {...register('password')} />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? '...' : t('submit')}
      </button>
    </form>
  );
}
