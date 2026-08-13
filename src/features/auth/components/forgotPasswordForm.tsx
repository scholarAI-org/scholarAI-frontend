'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForgotPassword } from '../hooks/useForgotPassword';
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormData,
} from '../schemas/forgot-password.schema';

export const ForgotPasswordForm = () => {
  const t = useTranslations('ForgotPassword');
  const { mutate, isPending, error } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
  });

  function onSubmit(data: ForgotPasswordFormData) {
    mutate(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input type="email" placeholder={t('email')} {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      {error && <p>{error.message}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? '...' : t('submit')}
      </button>
    </form>
  );
};
