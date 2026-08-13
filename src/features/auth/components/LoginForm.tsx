'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createLoginSchema, type LoginFormData } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';

export const LoginForm = () => {
  const t = useTranslations('Login');
  const { mutate, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
  });

  function onSubmit(data: LoginFormData) {
    mutate(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input type="email" placeholder={t('email')} {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input type="password" placeholder={t('password')} {...register('password')} />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      {error && <p>{error.message}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? '...' : t('submit')}
      </button>
    </form>
  );
};
