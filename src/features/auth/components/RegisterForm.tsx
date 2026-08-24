'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { useRegister } from '../hooks/useRegister';
import { createRegisterSchema, type RegisterFormData } from '../schemas/create-register.schema';
import { ApiError } from '@/lib/api-client';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthTabs } from '@/components/ui/AuthTabs';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { RegisterPanelVisual } from './RegisterPanel';

export function RegisterForm() {
  const t = useTranslations('Register');
  const { mutate, isPending, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);

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
      onError: (err) => {
        if (err instanceof ApiError) {
          err.details.forEach((detail) => {
            const fieldName = detail.loc[detail.loc.length - 1] as keyof RegisterFormData;
            setError(fieldName, { message: detail.msg });
          });
        }
      },
    });
  }

  return (
    <AuthLayout
      backgroundImage="/images/register-panel-bg.png"
      heroTitle={
        <>
          {t('panelTitleLine1')}
          <br />
          <span className="text-[var(--color-primary)]">{t('panelTitleHighlight')}</span>{' '}
          {t('panelTitleLine2')}
        </>
      }
      heroSubtitle={t('panelSubtitle')}
      visual={<RegisterPanelVisual />}
    >
      <div className="w-full max-w-sm text-start">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">{t('subtitle')}</p>
        <div className="mt-6">
          <AuthTabs active="register" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            label={t('name')}
            type="text"
            icon={<User className="h-4.5 w-4.5" />}
            errorMessage={errors.name?.message}
            {...register('name')}
          />

          <FormField
            label={t('email')}
            type="email"
            dir="ltr"
            icon={<Mail className="h-4.5 w-4.5" />}
            errorMessage={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-4">
            <FormField
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              icon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="pointer-events-auto"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              }
              errorMessage={errors.password?.message}
              {...register('password')}
            />

            <div>
              <Checkbox
                label={t.rich('agreeTerms', {
                  terms: (chunks) => <span className="text-[var(--color-primary)]">{chunks}</span>,
                  privacy: (chunks) => (
                    <span className="text-[var(--color-primary)]">{chunks}</span>
                  ),
                })}
                {...register('agreeTerms')}
              />
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-[var(--color-text-error)]">
                  {errors.agreeTerms.message}
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-xs text-[var(--color-text-error)]">
              {error.message}
            </p>
          )}

          <Button type="submit" isLoading={isPending} className="w-full">
            {t('submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-[var(--color-text-secondary)]">
          {t('copyright')}
        </p>
      </div>
    </AuthLayout>
  );
}
