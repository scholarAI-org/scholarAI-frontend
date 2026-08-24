import type { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  const combinedClassName = [
    'mb-2 block text-xs font-normal leading-5 text-[var(--color-text-label)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <label className={combinedClassName} {...props} />;
}
