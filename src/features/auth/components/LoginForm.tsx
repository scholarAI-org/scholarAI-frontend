'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { createLoginSchema, type LoginFormData } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { Link } from '@/i18n/navigation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthTabs } from '@/components/ui/AuthTabs';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoginPanelVisual } from './LoginPanel';

export function LoginForm() {
  const t = useTranslations('Login');
  const tPanel = useTranslations('AuthLayout');
  const { mutate, isPending, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
  });

  function onSubmit(data: LoginFormData) {
    // rememberMe مش جزء من الـ schema (ما بتحتاج validation)، بننقلها كـ خاصية إضافية
    // للـ mutate — لازم useLogin/login.ts يفلتروها قبل الإرسال للباك اند (نفس نمط
    // فلترة الـ payload المستخدم أصلاً بـ register.ts)
    mutate({ ...data, rememberMe });
  }

  return (
    <AuthLayout
      backgroundImage="/images/auth-panel-bg.png"
      heroTitle={
        <>
          {tPanel('heroTitleLine1')}
          <br />
          <span className="text-[var(--color-primary)]">{tPanel('heroTitleHighlight')}</span>{' '}
          {tPanel('heroTitleLine2')}
        </>
      }
      heroSubtitle={tPanel('heroSubtitle')}
      visual={<LoginPanelVisual />}
    >
      <div className="w-full max-w-sm text-start">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('title')}</h1>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t('subtitle')}</p>
        <div className="mt-6">
          <AuthTabs active="login" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <FormField
            label={t('email')}
            type="email"
            radius="full"
            icon={<Mail className="h-4.5 w-4.5" />}
            errorMessage={errors.email?.message}
            {...register('email')}
          />

          <div>
            <FormField
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              radius="full"
              icon={<Lock className="h-4.5 w-4.5" />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
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

            <div className="mt-2 flex items-center justify-between">
              <Checkbox
                label={t('rememberMe')}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-xs text-[var(--color-text-error)]">
              {error.message}
            </p>
          )}

          <Button type="submit" isLoading={isPending} className="w-full rounded-full">
            {t('submit')}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
