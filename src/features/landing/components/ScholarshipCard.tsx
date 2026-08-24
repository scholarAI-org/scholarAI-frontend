import { buttonStyles } from '@/components/ui/Button';
import { CalendarIcon } from '@/components/icons';

export interface ScholarshipCardData {
  fundingLabel: string;
  title: string;
  institution: string;
  deadline: string;
  ctaLabel: string;
}

export function ScholarshipCard({
  fundingLabel,
  title,
  institution,
  deadline,
  ctaLabel,
}: ScholarshipCardData) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(2,38,71,0.08)]">
      <div className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-teal-500)] px-3 py-1 text-[10px] font-normal text-[#1E1B33]">
          {fundingLabel}
        </span>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-black">{title}</h3>
          <p className="text-sm text-[var(--color-gray-500)]">{institution}</p>
        </div>
      </div>
      <hr className="border-t border-[var(--color-border-default)]" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-[var(--color-gray-500)]">
          <CalendarIcon className="h-5 w-5 shrink-0" />
          <span>{deadline}</span>
        </div>
        <button
          type="button"
          className={buttonStyles({
            variant: 'primary',
            size: 'sm',
            className: 'h-10 px-4 text-xs',
          })}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}
