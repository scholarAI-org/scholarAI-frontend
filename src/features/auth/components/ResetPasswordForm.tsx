'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff, Link2Off } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/shared/FormField';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api-client';
import { useResetPassword } from '../hooks/useResetPassword';
import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from '../schemas/reset-password.schema';
import { PasswordRecoveryLayout, RecoveryLockMark } from './PasswordRecoveryLayout';

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations('ResetPassword');
  const mutation = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(createResetPasswordSchema(t)),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const invalidToken =
    !token || (mutation.error instanceof ApiError && mutation.error.status === 400);

  if (invalidToken) {
    return (
      <PasswordRecoveryLayout>
        <section className="text-center" role="alert">
          <Link2Off
            className="mx-auto size-[88px] text-[var(--color-text-error)]"
            strokeWidth={1.4}
          />
          <h1 className="mt-6 text-xl font-bold text-[var(--color-text-primary)]">
            {t('invalidTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-[22px] text-[var(--color-text-secondary)]">
            {t('invalidDescription')}
          </p>
          <Link
            href="/forgot-password"
            className={buttonStyles({ className: 'mt-8 w-full rounded-full' })}
          >
            {t('requestAnother')}
          </Link>
        </section>
      </PasswordRecoveryLayout>
    );
  }

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
            {t('login')}
          </Link>
        </section>
      </PasswordRecoveryLayout>
    );
  }

  const visibilityButton = (visible: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={visible ? t('hidePassword') : t('showPassword')}
      className="pointer-events-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
    >
      {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
    </button>
  );

  return (
    <PasswordRecoveryLayout>
      <RecoveryLockMark />
      <section className="mt-6">
        <header className="text-center">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--color-text-secondary)]">
            {t('description')}
          </p>
        </header>

        <form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({ token, new_password: data.new_password })
          )}
          className="mt-6 space-y-2"
        >
          <FormField
            label={t('newPassword')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            dir="ltr"
            disabled={mutation.isPending}
            icon={visibilityButton(showPassword, () => setShowPassword((value) => !value))}
            iconPosition="end"
            className="rounded-full"
            errorMessage={errors.new_password?.message}
            {...register('new_password')}
          />
          <FormField
            label={t('confirmPassword')}
            type={showConfirmation ? 'text' : 'password'}
            autoComplete="new-password"
            dir="ltr"
            disabled={mutation.isPending}
            icon={visibilityButton(showConfirmation, () => setShowConfirmation((value) => !value))}
            iconPosition="end"
            className="rounded-full"
            errorMessage={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          {mutation.isError && (
            <p
              role="alert"
              className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
            >
              {mutation.error instanceof ApiError && mutation.error.status === 404
                ? t('userNotFound')
                : t('requestError')}
            </p>
          )}

          <Button type="submit" isLoading={mutation.isPending} className="mt-4 w-full rounded-full">
            {mutation.isPending ? t('resetting') : t('submit')}
          </Button>
        </form>
      </section>
    </PasswordRecoveryLayout>
  );
}
