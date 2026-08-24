import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] font-bold text-[var(--color-primary-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-page)]',
  ghost: 'bg-transparent font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg-page)]',
  // للاستخدام فوق خلفيات غامقة (مثال: شريط CTA الكحلي) — يرث لون النص من الأب عبر currentColor
  outline: 'border border-current bg-transparent font-bold hover:bg-white/10',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-[52px] px-4 text-sm',
  lg: 'h-12 px-6 text-lg',
};

/** نفس مظهر Button لكن كـ className خام — يُستخدم مع `Link` بدل `<button>` (مثال: أزرار CTA بصفحة الهبوط) عشان نتفادى تعشيش <button> جوا <a>. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [baseStyles, variantStyles[variant], sizeStyles[size], className]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const combinedClassName = [baseStyles, variantStyles[variant], sizeStyles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
