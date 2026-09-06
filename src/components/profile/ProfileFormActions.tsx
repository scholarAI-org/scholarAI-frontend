'use client';

import type { ReactNode } from 'react';
import { ProgressMeter } from './ProgressMeter';

interface ProfileFormActionsProps {
  children: ReactNode;
  completion?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function ProfileFormActions({
  children,
  completion,
  className = '',
}: ProfileFormActionsProps) {
  return (
    <div
      className={`mt-8 flex flex-col-reverse items-center justify-between gap-5 border-t border-[#e2e8f0] pt-6 sm:flex-row ${className}`}
    >
      <div className="w-full sm:w-auto">{children}</div>

      {completion && (
        <div className="w-full sm:w-[200px]">
          <ProgressMeter value={completion.value} label={completion.label} />
        </div>
      )}
    </div>
  );
}
