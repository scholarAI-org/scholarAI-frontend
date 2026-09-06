import type { FormEventHandler } from 'react';
import ProfileField from './ProfileField';
import type { ProfileCompletion, ProfileFieldData } from './types';
import { ProfileFormActions } from './ProfileFormActions';
import { ProfileSaveContinueButton } from './ProfileSaveContinueButton';

interface ProfileFormCardProps {
  title: string;
  fields: ProfileFieldData[];
  values: Partial<Record<string, string>>;
  errors: Record<string, string | undefined>;
  completion: ProfileCompletion;
  actionLabel?: string;
  disabled?: boolean;
  isSaving?: boolean;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export default function ProfileFormCard({
  title,
  fields,
  values,
  errors,
  completion,
  disabled = false,
  isSaving = false,
  onFieldChange,
  onSubmit,
}: ProfileFormCardProps) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSaving}
      className="rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.02)] sm:p-6 lg:min-h-[732px]"
    >
      <h2 className="text-start text-base font-bold leading-5 text-black">{title}</h2>

      <fieldset
        disabled={disabled || isSaving}
        className="mt-6 grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2"
      >
        {fields.map((field) => (
          <ProfileField
            key={field.id}
            field={field}
            value={values[field.id] ?? ''}
            errorMessage={errors[field.id]}
            onChange={(value) => onFieldChange(field.id, value)}
          />
        ))}
      </fieldset>

      <ProfileFormActions completion={completion}>
        <ProfileSaveContinueButton type="submit" disabled={disabled} isLoading={isSaving} />
      </ProfileFormActions>
    </form>
  );
}
