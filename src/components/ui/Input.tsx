import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}

export function Input({
  hasError,
  icon,
  iconPosition = 'start',
  className,
  dir,
  type,
  ...props
}: InputProps) {
  const inputDirection =
    dir ?? (type === 'email' || type === 'tel' || type === 'url' ? 'ltr' : undefined);
  const inputClassName = [
    'h-[52px] w-full rounded-[var(--radius-input)] border px-4 text-xs text-[var(--color-text-label)] outline-none transition-colors',
    hasError
      ? 'border-[var(--color-border-error)] bg-[var(--color-bg-error-subtle)]'
      : 'border-[var(--color-border-default)] focus:border-[var(--color-border-focus)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // بدون أيقونة: input عادي، بدون أي wrapper إضافي زايد عن الحاجة
  if (!icon) {
    return <input className={inputClassName} type={type} dir={inputDirection} {...props} />;
  }

  // مع أيقونة: لازم wrapper بـ position relative عشان نموضع الأيقونة فوق الحقل
  return (
    <div className="input-icon-shell relative" data-icon-position={iconPosition}>
      <span
        className={[
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]',
          iconPosition === 'start' ? 'start-3' : 'end-3',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon}
      </span>
      <input className={inputClassName} type={type} dir={inputDirection} {...props} />
    </div>
  );
}
