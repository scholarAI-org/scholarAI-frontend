'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Link, useRouter } from '@/i18n/navigation';
import { useResendVerificationOtp } from '../hooks/useResendVerificationOtp';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import { createVerifyEmailSchema, type VerifyEmailFormData } from '../schemas/verify-email.schema';
import { EmailVerificationLayout } from './EmailVerificationLayout';
import { OtpInput } from './OtpInput';

const RESEND_DELAY_SECONDS = 55;

export function VerifyEmailForm({ email }: { email?: string }) {
  const t = useTranslations('VerifyEmail');
  const router = useRouter();
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationOtp();
  const [secondsRemaining, setSecondsRemaining] = useState(RESEND_DELAY_SECONDS);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(createVerifyEmailSchema(t)),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  if (!email) {
    return (
      <EmailVerificationLayout>
        <section className="text-center" role="alert">
          <Image
            src="/images/email-verification.svg"
            alt=""
            width={120}
            height={120}
            className="mx-auto size-[120px]"
          />
          <h1 className="mt-6 text-xl font-bold text-[var(--color-text-primary)]">
            {t('missingEmailTitle')}
          </h1>
          <p className="mt-3 text-sm leading-[22px] text-[var(--color-text-secondary)]">
            {t('missingEmailDescription')}
          </p>
          <Link
            href="/register"
            className={buttonStyles({ className: 'mt-8 w-full rounded-full' })}
          >
            {t('backToRegister')}
          </Link>
        </section>
      </EmailVerificationLayout>
    );
  }

  const verifiedEmail = email;

  const countdown = `${String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:${String(
    secondsRemaining % 60
  ).padStart(2, '0')}`;

  function resend() {
    resendMutation.mutate(
      { email: verifiedEmail },
      {
        onSuccess: () => setSecondsRemaining(RESEND_DELAY_SECONDS),
      }
    );
  }

  return (
    <EmailVerificationLayout>
      <section>
        <header className="text-center">
          <div className="mx-auto flex size-[120px] items-center justify-center rounded-full bg-[rgba(148,163,184,0.08)]">
            <Image
              src="/images/email-verification.svg"
              alt=""
              width={103}
              height={103}
              className="size-[103px]"
            />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">{t('title')}</h1>
          <p className="mt-4 text-sm leading-[22px] text-[var(--color-text-secondary)]">
            {t('description')}
          </p>
          <div className="mt-1 flex min-w-0 items-center justify-center gap-2 text-sm">
            <bdi dir="ltr" className="min-w-0 truncate text-[var(--color-text-label)]">
              {verifiedEmail}
            </bdi>
            <Link href="/register" className="shrink-0 text-[var(--color-primary)] hover:underline">
              {t('changeEmail')}
            </Link>
          </div>
        </header>

        <form
          className="mt-6"
          onSubmit={handleSubmit((data) =>
            verifyMutation.mutate(
              { email: verifiedEmail, otp: data.otp },
              { onSuccess: () => router.push('/verify-email/success') }
            )
          )}
        >
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <OtpInput
                onChange={field.onChange}
                label={t('otpLabel')}
                disabled={verifyMutation.isPending}
                hasError={!!errors.otp}
                errorId="verification-code-error"
              />
            )}
          />
          {errors.otp && (
            <p
              id="verification-code-error"
              role="alert"
              className="mt-2 text-center text-sm text-[var(--color-text-error)]"
            >
              {errors.otp.message}
            </p>
          )}
          {verifyMutation.isError && (
            <p
              role="alert"
              className="mt-2 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-center text-sm text-[var(--color-text-error)]"
            >
              {t('verificationError')}
            </p>
          )}
          <Button
            type="submit"
            isLoading={verifyMutation.isPending}
            className="mt-6 w-full rounded-full"
          >
            {verifyMutation.isPending ? t('verifying') : t('submit')}
          </Button>
        </form>

        <div className="mt-3 flex min-h-8 items-center justify-center gap-2 text-sm">
          {secondsRemaining > 0 ? (
            <>
              <span className="text-[var(--color-text-label)]">{t('resendAvailable')}</span>
              <bdi dir="ltr" className="font-bold text-[var(--color-primary)]">
                {countdown}
              </bdi>
            </>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resendMutation.isPending}
              className="rounded-sm font-bold text-[var(--color-primary)] hover:underline disabled:opacity-50"
            >
              {resendMutation.isPending ? t('resending') : t('resend')}
            </button>
          )}
        </div>
        {resendMutation.isSuccess && (
          <p aria-live="polite" className="text-center text-xs text-[var(--color-success)]">
            {t('resentSuccess')}
          </p>
        )}
        {resendMutation.isError && (
          <p role="alert" className="text-center text-xs text-[var(--color-text-error)]">
            {t('resendError')}
          </p>
        )}

        <aside className="mt-3 rounded-xl border border-[var(--color-border-default)] bg-[#f8fafc] p-4 text-start">
          <h2 className="text-xs font-bold text-[var(--color-text-label)]">{t('helpTitle')}</h2>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--color-text-secondary)]">
            <li>
              <span className="text-[var(--color-primary)]">•</span> {t('helpSpam')}
            </li>
            <li>
              <span className="text-[var(--color-primary)]">•</span> {t('helpDelay')}
            </li>
            <li>
              <span className="text-[var(--color-primary)]">•</span> {t('helpEmail')}
            </li>
          </ul>
        </aside>
      </section>
    </EmailVerificationLayout>
  );
}
