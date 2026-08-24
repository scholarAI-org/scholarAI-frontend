import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  icon?: ReactNode;
}

export function Input({ hasError, icon, className, ...props }: InputProps) {
  const inputClassName = [
    'h-[52px] w-full rounded-[var(--radius-input)] border px-4 text-xs text-[var(--color-text-label)] outline-none transition-colors',
    icon ? 'ps-10' : '',
    hasError
      ? 'border-[var(--color-border-error)] bg-[var(--color-bg-error-subtle)]'
      : 'border-[var(--color-border-default)] focus:border-[var(--color-border-focus)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // بدون أيقونة: input عادي، بدون أي wrapper إضافي زايد عن الحاجة
  if (!icon) {
    return <input className={inputClassName} {...props} />;
  }

  // مع أيقونة: لازم wrapper بـ position relative عشان نموضع الأيقونة فوق الحقل
  return (
    <div className="relative">
      <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <input className={inputClassName} {...props} />
    </div>
  );
}
