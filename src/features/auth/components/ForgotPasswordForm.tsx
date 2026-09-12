'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/shared/FormField';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { useForgotPassword } from '../hooks/useForgotPassword';
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormData,
} from '../schemas/forgot-password.schema';
import { PasswordRecoveryLayout, RecoveryLockMark } from './PasswordRecoveryLayout';

export function ForgotPasswordForm() {
  const t = useTranslations('ForgotPassword');
  const mutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: { email: '' },
  });

  if (mutation.isSuccess) {
    return (
      <PasswordRecoveryLayout>
        <section className="text-center" aria-live="polite">
          <CheckCircle2
            className="mx-auto size-[88px] text-[var(--color-success)]"
            strokeWidth={1.5}
          />
          <h1 className="mt-6 text-xl font-bold text-[var(--color-text-primary)]">
            {t('successTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-[22px] text-[var(--color-text-secondary)]">
            {t('successDescription')}
          </p>
          <Link href="/login" className={buttonStyles({ className: 'mt-8 w-full rounded-full' })}>
            {t('backToLogin')}
          </Link>
        </section>
      </PasswordRecoveryLayout>
    );
  }

  return (
    <PasswordRecoveryLayout>
      <RecoveryLockMark />
      <section className="mt-6">
        <header className="text-center">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('title')}</h1>
          <p className="mt-4 text-sm leading-[22px] text-[var(--color-text-secondary)]">
            {t('description')}
          </p>
        </header>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-6 space-y-6">
          <FormField
            label={t('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            disabled={mutation.isPending}
            icon={<Mail className="size-[18px] text-[#2b3f6c]" />}
            iconPosition="end"
            className="rounded-full"
            errorMessage={errors.email?.message}
            {...register('email')}
          />

          {mutation.isError && (
            <p
              role="alert"
              className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
            >
              {t('requestError')}
            </p>
          )}

          <Button type="submit" isLoading={mutation.isPending} className="w-full rounded-full">
            {mutation.isPending ? t('sending') : t('submit')}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
          {t('remembered')}{' '}
          <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
            {t('login')}
          </Link>
        </p>
      </section>
    </PasswordRecoveryLayout>
  );
}
