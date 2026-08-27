interface SectionHeadingProps {
  badge: string;
  heading: string;
  className?: string;
}

export function SectionHeading({ badge, heading, className }: SectionHeadingProps) {
  return (
    <div className={['flex flex-col items-start gap-4', className].filter(Boolean).join(' ')}>
      <span className="rounded-full bg-[var(--color-bg-accent-subtle)] px-3 py-1.5 text-sm font-bold text-[var(--color-text-eyebrow)]">
        {badge}
      </span>
      <h2 className="text-2xl font-bold text-[var(--color-navy-800)]">{heading}</h2>
    </div>
  );
}
