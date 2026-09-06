import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import ProfileDatePicker from './ProfileDatePicker';
import ProfileDropdown from './ProfileDropdown';
import ProfilePhoneField from './ProfilePhoneField';
import type { ProfileFieldData } from './types';

interface ProfileFieldProps {
  field: ProfileFieldData;
  value: string;
  errorMessage?: string;
  onChange: (value: string) => void;
}

const minimumProfileAge = 16;

function getLatestAllowedBirthDate() {
  const today = new Date();
  const latestBirthDate = new Date(
    today.getFullYear() - minimumProfileAge,
    today.getMonth(),
    today.getDate()
  );

  const year = latestBirthDate.getFullYear();
  const month = String(latestBirthDate.getMonth() + 1).padStart(2, '0');
  const day = String(latestBirthDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function ProfileField({ field, value, errorMessage, onChange }: ProfileFieldProps) {
  const inputId = `profile-field-${field.id}`;

  return (
    <div>
      <Label htmlFor={inputId} className="text-start">
        {field.label}
      </Label>

      {field.kind === 'phone' ? (
        <ProfilePhoneField
          id={inputId}
          value={value}
          placeholder={field.placeholder}
          options={field.callingCodeOptions ?? []}
          disabled={field.disabled}
          errorMessage={errorMessage}
          onChange={onChange}
        />
      ) : field.kind === 'select' ? (
        <ProfileDropdown
          id={inputId}
          value={value}
          placeholder={field.placeholder}
          options={field.options ?? []}
          disabled={field.disabled}
          searchable={field.searchable}
          errorMessage={errorMessage}
          onChange={onChange}
        />
      ) : field.kind === 'date' ? (
        <ProfileDatePicker
          id={inputId}
          value={value}
          placeholder={field.placeholder}
          errorMessage={errorMessage}
          maxDate={getLatestAllowedBirthDate()}
          onChange={onChange}
        />
      ) : (
        <Input
          id={inputId}
          name={field.id}
          type={field.inputType}
          dir={field.dir}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          hasError={!!errorMessage}
          className="h-[52px] rounded-full bg-[#f8fafc] rtl:text-right ltr:text-left text-sm leading-6 text-[#434343] placeholder:text-[#979797]"
        />
      )}

      {errorMessage && (
        <p className="mt-1 text-sm text-[var(--color-text-error)]">{errorMessage}</p>
      )}
    </div>
  );
}
