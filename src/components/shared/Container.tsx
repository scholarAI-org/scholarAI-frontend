import type { HTMLAttributes } from 'react';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const combinedClassName = ['mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-[120px]', className]
    .filter(Boolean)
    .join(' ');

  return <div className={combinedClassName} {...props} />;
}
