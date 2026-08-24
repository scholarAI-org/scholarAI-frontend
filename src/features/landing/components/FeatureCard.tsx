import type { ComponentType, SVGProps } from 'react';

export interface FeatureCardData {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export function FeatureCard({ title, description, icon: Icon }: FeatureCardData) {
  return (
    <div className="flex items-start gap-5 rounded-2xl bg-white px-6 py-8 shadow-[0_8px_24px_rgba(2,38,71,0.08)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-green-600)]">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-black">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--color-gray-500)]">{description}</p>
      </div>
    </div>
  );
}
