interface ProfileCompletionRingProps {
  percentage: number | null | undefined;
  label?: string;
}

export function ProfileCompletionRing({
  percentage,
  label = 'اكتمال الملف الشخصي',
}: ProfileCompletionRingProps) {
  const numericPercentage = Number.isFinite(percentage) ? Number(percentage) : 0;
  const value = Math.min(100, Math.max(0, numericPercentage));
  const displayValue = Math.round(value);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div
        className="relative size-[104px]"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayValue}
      >
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-gray-300)"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#274383"
            strokeLinecap="round"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-medium text-[#274383]">
          <bdi dir="ltr">{displayValue}%</bdi>
        </span>
      </div>
      <span className="text-center text-sm text-[var(--color-text-label)]">{label}</span>
    </div>
  );
}
