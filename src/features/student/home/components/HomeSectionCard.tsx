'use client';

import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface HomeSectionCardProps {
  title: string;
  icon: LucideIcon;
  // Tint of the icon chip (Figma uses a different tint per section).
  chipClassName: string;
  children: ReactNode;
}

// Section frame: icon chip + heading above a white card (Figma 2358:7664).
export function HomeSectionCard({
  title,
  icon: Icon,
  chipClassName,
  children,
}: HomeSectionCardProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${chipClassName}`}
        >
          <Icon className="size-5" />
        </span>
        <h2 id={headingId} className="min-w-0 text-base font-bold text-[#434343]">
          {title}
        </h2>
      </div>
      <div className="min-w-0 rounded-2xl border border-gray-300 bg-white p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}
