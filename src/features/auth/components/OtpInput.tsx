'use client';

import { useRef, useState } from 'react';

interface OtpInputProps {
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  hasError?: boolean;
  errorId?: string;
}

const OTP_LENGTH = 6;

export function OtpInput({ onChange, label, disabled, hasError, errorId }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(() => Array.from({ length: OTP_LENGTH }, () => ''));

  function updateDigit(index: number, input: string) {
    const numeric = input.replace(/\D/g, '');
    if (!numeric) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      onChange(next.join(''));
      return;
    }
    if (numeric.length > 1) {
      applyPastedCode(numeric, index);
      return;
    }
    const next = [...digits];
    next[index] = numeric;
    setDigits(next);
    onChange(next.join(''));
    refs.current[Math.min(index + 1, OTP_LENGTH - 1)]?.focus();
  }

  function applyPastedCode(input: string, startIndex = 0) {
    const numeric = input.replace(/\D/g, '').slice(0, OTP_LENGTH - startIndex);
    if (!numeric) return;
    const next = [...digits];
    numeric.split('').forEach((digit, offset) => {
      next[startIndex + offset] = digit;
    });
    setDigits(next);
    onChange(next.join(''));
    refs.current[Math.min(startIndex + numeric.length, OTP_LENGTH - 1)]?.focus();
  }

  return (
    <fieldset
      dir="ltr"
      className="min-w-0"
      aria-invalid={hasError}
      aria-describedby={hasError ? errorId : undefined}
    >
      <legend className="sr-only">{label}</legend>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digit && index > 0) {
                refs.current[index - 1]?.focus();
              }
              if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
              if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1)
                refs.current[index + 1]?.focus();
            }}
            onPaste={(event) => {
              event.preventDefault();
              applyPastedCode(event.clipboardData.getData('text'), index);
            }}
            onFocus={(event) => event.currentTarget.select()}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            aria-label={`${label} ${index + 1}`}
            aria-invalid={hasError}
            className={`aspect-square min-w-0 rounded-full border-2 bg-white text-center text-xl font-bold text-[#274383] shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none transition disabled:opacity-50 sm:size-16 ${
              hasError
                ? 'border-[var(--color-border-error)]'
                : 'border-[var(--color-border-default)] focus:border-[var(--color-success)] focus:ring-4 focus:ring-[rgba(22,193,114,0.15)]'
            }`}
          />
        ))}
      </div>
    </fieldset>
  );
}
