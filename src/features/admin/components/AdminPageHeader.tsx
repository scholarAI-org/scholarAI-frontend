import type { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div className="pointer-events-none flex min-h-[72px] flex-col justify-center text-start lg:h-[108px]">
      <h1 className="text-lg font-bold leading-none text-[#434343]">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[#b5b5b5] sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
