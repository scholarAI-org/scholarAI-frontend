import { useId } from 'react';
import { Label } from '../ui/Label';
import { Input, type InputProps } from '../ui/Input';

interface FormFieldProps extends InputProps {
  label: string;
  errorMessage?: string;
}

export function FormField({ label, errorMessage, id, ...inputProps }: FormFieldProps) {
  // useId بيولّد id فريد وثابت لكل instance من الكومبوننت، مش بيتغير بين re-renders
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        hasError={!!errorMessage}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : inputProps['aria-describedby']}
        {...inputProps}
      />
      {errorMessage && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-[var(--color-text-error)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
