import { StarIcon } from '@/components/icons';

export interface TestimonialCardData {
  quote: string;
  name: string;
  subtitle: string;
  initial: string;
}

export function TestimonialCard({ quote, name, subtitle, initial }: TestimonialCardData) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-8 shadow-[0_8px_24px_rgba(2,38,71,0.08)]">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className="h-4 w-4 text-[var(--color-primary)]" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-black">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-normal text-white">
          {initial}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-bold text-black">{name}</p>
          <p className="text-xs text-[var(--color-gray-400)]">{subtitle}</p>
        </div>
      </div>
    </article>
  );
}
