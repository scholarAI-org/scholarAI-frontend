'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import {
  composeInternationalPhone,
  findCallingCodeForPhone,
  phoneDigits,
} from '@/features/profile/lib/phone-number';
import ProfileDropdown from './ProfileDropdown';
import type { ProfileCallingCodeOption } from './types';

interface ProfilePhoneFieldProps {
  id: string;
  value: string;
  placeholder?: string;
  options: ProfileCallingCodeOption[];
  disabled?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
}

export default function ProfilePhoneField({
  id,
  value,
  placeholder,
  options,
  disabled,
  errorMessage,
  onChange,
}: ProfilePhoneFieldProps) {
  const detectedOption = useMemo(() => findCallingCodeForPhone(value, options), [options, value]);
  const palestineOption = options.find((option) => option.countryCode === 'PS');
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [localDraft, setLocalDraft] = useState({ display: '', canonical: '' });

  const selectedOption =
    detectedOption ??
    options.find((option) => option.value === selectedOptionValue) ??
    palestineOption ??
    options[0];
  const internationalDigits = phoneDigits(value);
  const dialDigits = selectedOption ? phoneDigits(selectedOption.dialCode) : '';
  const valueLocalNumber = internationalDigits.startsWith(dialDigits)
    ? internationalDigits.slice(dialDigits.length)
    : internationalDigits.replace(/^0+/, '');
  // Keep the familiar local leading zero visible while the form holds the
  // normalized international value. Parent changes are derived automatically.
  const localNumber = localDraft.canonical === value ? localDraft.display : valueLocalNumber;

  function updatePhone(option: ProfileCallingCodeOption | undefined, localValue: string) {
    const nextLocalNumber = phoneDigits(localValue);
    const canonical = composeInternationalPhone(option, nextLocalNumber);
    setLocalDraft({ display: nextLocalNumber, canonical });
    onChange(canonical);
  }

  return (
    <div className="flex gap-2" dir="ltr">
      <div className="min-w-0 flex-1">
        <Input
          id={id}
          name="phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel-national"
          value={localNumber}
          maxLength={15}
          disabled={disabled || !selectedOption}
          hasError={!!errorMessage}
          placeholder={placeholder}
          onChange={(event) => updatePhone(selectedOption, event.target.value)}
          className="h-[52px] rounded-full bg-[#f8fafc] text-start text-sm leading-6 text-[#434343] placeholder:text-[#979797]"
        />
      </div>

      <div className="w-[150px] shrink-0 sm:w-[180px]">
        <ProfileDropdown
          id={`${id}-country-code`}
          value={selectedOption?.value ?? ''}
          placeholder="+___"
          options={options}
          disabled={disabled || !options.length}
          searchable
          errorMessage={errorMessage}
          onChange={(nextOptionValue) => {
            const nextOption = options.find((option) => option.value === nextOptionValue);
            const canonical = composeInternationalPhone(nextOption, localNumber);
            setSelectedOptionValue(nextOptionValue);
            setLocalDraft({ display: localNumber, canonical });
            onChange(canonical);
          }}
        />
      </div>
    </div>
  );
}
