import type { ReactNode } from 'react';

type ControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
};

type ManualScholarshipFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  helperText?: string;
  errorMessage?: string;
  children: (controlProps: ControlProps) => ReactNode;
};

export function ManualScholarshipField({
  name,
  label,
  required = false,
  optionalLabel,
  helperText,
  errorMessage,
  children,
}: ManualScholarshipFieldProps) {
  const id = `manual-scholarship-${name}`;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = [helperText ? helperId : null, errorMessage ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-w-0 space-y-1.5 text-start">
      <label htmlFor={id} className="block text-sm font-medium text-[#434343]">
        {label}
        {required ? (
          <span className="ms-1 text-[#dc2626]" aria-hidden="true">
            *
          </span>
        ) : null}
        {!required && optionalLabel ? (
          <span className="ms-2 text-xs font-normal text-[#979797]">{optionalLabel}</span>
        ) : null}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(errorMessage),
        'aria-describedby': describedBy || undefined,
      })}
      {helperText ? (
        <p id={helperId} className="text-xs leading-5 text-[#979797]">
          {helperText}
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} role="alert" className="text-sm text-[var(--color-text-error)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
