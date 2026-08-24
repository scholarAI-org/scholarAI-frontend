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

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} hasError={!!errorMessage} {...inputProps} />
      {errorMessage && (
        <p className="mt-1 text-sm text-[var(--color-text-error)]">{errorMessage}</p>
      )}
    </div>
  );
}
