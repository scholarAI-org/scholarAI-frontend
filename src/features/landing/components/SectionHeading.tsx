interface SectionHeadingProps {
  badge: string;
  heading: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ badge, heading, subtitle, className }: SectionHeadingProps) {
  return (
    <div
      data-landing-reveal="0"
      className={['landing-heading', className].filter(Boolean).join(' ')}
    >
      <span>{badge}</span>
      <h2>{heading}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
