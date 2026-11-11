'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { RESET_PASSWORD_MIN_LENGTH } from '@/features/auth/schemas/password.schema';
import { useChangePassword } from '../hooks/useChangePassword';
import { useSessionCheck } from '../hooks/useSessionCheck';
import { buildChangePasswordRequest } from '../lib/build-request';
import { classifyChangePasswordError, describeChangePasswordFailure } from '../lib/failure';
import {
  CHANGE_PASSWORD_DEFAULT_VALUES,
  createChangePasswordSchema,
  type ChangePasswordFormValues,
} from '../schemas/change-password.schema';
import { PasswordField } from './PasswordField';

export function ChangePasswordForm() {
  const t = useTranslations('Settings.changePassword');
  const tValidation = useTranslations('Settings.validation');
  const tFeedback = useTranslations('Settings.feedback');
  const mutation = useChangePassword();
  const checkSession = useSessionCheck();
  const hintId = useId();
  const otherDevicesHintId = useId();

  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  // Bumped whenever the password fields are emptied, so each field remounts with its
  // show/hide toggle back on "hidden". `focusRequest` moves focus to the first field once
  // that remount has happened.
  const [fieldsEpoch, setFieldsEpoch] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);
  // The mutation's own `isPending` only flips after a render, so a second Enter in the same
  // tick would slip through. This closes that gap.
  const submitting = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(createChangePasswordSchema(tValidation)),
    defaultValues: CHANGE_PASSWORD_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (focusRequest > 0) setFocus('currentPassword');
  }, [focusRequest, setFocus]);

  async function onSubmit(values: ChangePasswordFormValues) {
    if (submitting.current) return;
    submitting.current = true;
    setFormError(null);
    setSucceeded(false);

    let failed = false;
    let failure: unknown;
    try {
      await mutation.mutateAsync(buildChangePasswordRequest(values));
    } catch (error) {
      failed = true;
      failure = error;
    } finally {
      submitting.current = false;
    }

    if (failed) {
      await showFailure(failure);
      return;
    }

    reset(CHANGE_PASSWORD_DEFAULT_VALUES);
    setFieldsEpoch((epoch) => epoch + 1);
    setSucceeded(true);
    // The change is done. Whether this device is still signed in is checked in the
    // background; if not, the student is sent to login and returns here afterwards.
    void checkSession();
  }

  async function showFailure(error: unknown) {
    const failure = classifyChangePasswordError(error);
    const feedback = describeChangePasswordFailure(failure, (key) => tFeedback(key));

    if (feedback.clearPasswords) {
      reset({
        ...CHANGE_PASSWORD_DEFAULT_VALUES,
        signOutOtherDevices: getValues('signOutOtherDevices'),
      });
      setFieldsEpoch((epoch) => epoch + 1);
      setFocusRequest((request) => request + 1);
    }
    for (const [field, message] of Object.entries(feedback.fieldErrors)) {
      setError(field as 'currentPassword' | 'newPassword', { type: 'server', message });
    }

    if (feedback.recheckSession) {
      // 401: the session may be gone. If it is, the student is already on their way to
      // login; if it is not, "your session ended" would be wrong, so say the generic thing.
      const result = await checkSession();
      setFormError(result === 'expired' ? feedback.formError : tFeedback('unavailable'));
      return;
    }
    setFormError(feedback.formError);
  }

  const pending = mutation.isPending;

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="flex max-w-md flex-col gap-4"
    >
      <PasswordField
        key={`current-${fieldsEpoch}`}
        label={t('currentPassword')}
        autoComplete="current-password"
        readOnly={pending}
        showLabel={t('showPassword')}
        hideLabel={t('hidePassword')}
        errorMessage={errors.currentPassword?.message}
        {...register('currentPassword')}
      />

      <div>
        <PasswordField
          key={`new-${fieldsEpoch}`}
          label={t('newPassword')}
          autoComplete="new-password"
          readOnly={pending}
          showLabel={t('showPassword')}
          hideLabel={t('hidePassword')}
          errorMessage={errors.newPassword?.message}
          {...(errors.newPassword ? {} : { 'aria-describedby': hintId })}
          {...register('newPassword')}
        />
        <p id={hintId} className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
          {t('newPasswordHint', { count: RESET_PASSWORD_MIN_LENGTH })}
        </p>
      </div>

      <PasswordField
        key={`confirm-${fieldsEpoch}`}
        label={t('confirmPassword')}
        autoComplete="new-password"
        readOnly={pending}
        showLabel={t('showPassword')}
        hideLabel={t('hidePassword')}
        errorMessage={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div className="flex flex-col gap-1">
        <div className="flex min-h-11 items-center">
          <Checkbox
            label={t('signOutOtherDevices')}
            disabled={pending}
            aria-describedby={otherDevicesHintId}
            {...register('signOutOtherDevices')}
          />
        </div>
        <p id={otherDevicesHintId} className="text-xs leading-5 text-[var(--color-text-secondary)]">
          {t('signOutOtherDevicesHint')}
        </p>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {formError}
        </p>
      )}

      {/* Always in the tree, so the message is announced when it appears. */}
      <div role="status" aria-live="polite">
        {succeeded && (
          <p className="flex items-start gap-2 rounded-lg bg-[var(--color-bg-success-subtle)] px-3 py-2 text-sm text-[#15803d]">
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{tFeedback('success')}</span>
          </p>
        )}
      </div>

      <Button type="submit" isLoading={pending} className="w-full sm:w-auto sm:min-w-48">
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
