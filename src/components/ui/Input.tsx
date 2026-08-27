import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  /** أيقونة جهة البداية — يمين في RTL (مثال: Mail, Lock) */
  icon?: ReactNode;
  /** أيقونة جهة النهاية — يسار في RTL (مثال: زر إظهار/إخفاء كلمة المرور) */
  endIcon?: ReactNode;
  /** 'md' = --radius-input (12px). 'full' = pill shape. */
  radius?: 'md' | 'full';
}

export function Input({
  hasError,
  icon,
  endIcon,
  radius = 'md',
  className,
  dir,
  ...props
}: InputProps) {
  const inputClassName = [
    'h-[52px] w-full border px-4 text-xs text-[var(--color-text-label)] outline-none transition-colors',
    radius === 'full' ? 'rounded-full' : 'rounded-[var(--radius-input)]',
    icon ? 'ps-10' : '',
    endIcon ? 'pe-10' : '',
    hasError
      ? 'border-[var(--color-border-error)] bg-[var(--color-bg-error-subtle)]'
      : 'border-[var(--color-border-default)] focus:border-[var(--color-border-focus)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // بدون أيقونة: input عادي، بدون wrapper
  if (!icon && !endIcon) {
    return <input className={inputClassName} dir={dir} {...props} />;
  }

  // مع أيقونة واحدة أو أكثر: نحتاج wrapper بـ position relative
  return (
    <div className="relative">
      {/* أيقونة البداية (يمين في RTL) — pointer-events-none لأنها ديكور فقط */}
      {icon && (
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
          {icon}
        </span>
      )}
      {/* أيقونة النهاية (يسار في RTL) — لا pointer-events-none لأنها قد تكون زراً تفاعلياً */}
      {endIcon && (
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
          {endIcon}
        </span>
      )}
      <input className={inputClassName} dir={dir} {...props} />
    </div>
  );
}
