import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  // نفس منطق FormField: id ثابت لكل instance، يربط label بالـ input فعلياً
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const inputClassName = [
    'h-[13px] w-[13px] shrink-0 rounded-[2px] border-[var(--color-border-default)] accent-[var(--color-primary)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" id={inputId} className={inputClassName} {...props} />
      {label && (
        <label
          htmlFor={inputId}
          className="cursor-pointer text-xs text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
    </div>
  );
}
