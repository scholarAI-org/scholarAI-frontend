import type { ReactNode } from 'react';

interface SectionEmptyProps {
  title: string;
  action?: ReactNode;
}

export function SectionEmpty({ title, action }: SectionEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-[#b5b5b5]">{title}</p>
      {action}
    </div>
  );
}
