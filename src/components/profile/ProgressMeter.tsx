interface ProgressMeterProps {
  value: number;
  label?: string;
  size?: 'compact' | 'circle';
}

export function ProgressMeter({ value, label, size = 'compact' }: ProgressMeterProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  if (size === 'circle') {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (safeValue / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-[72px] w-[72px]">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="#274383"
              strokeLinecap="round"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[19px] leading-none text-[#274383]">
            <bdi dir="ltr">{safeValue}%</bdi>
          </span>
        </div>
        {label && (
          <span className="w-[114px] text-center text-[10px] leading-none text-[rgba(30,27,51,0.7)]">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && <p className="mb-1 text-start text-xs leading-5 text-[#979797]">{label}</p>}
      <div className="flex flex-row-reverse items-center gap-3">
        <span className="text-sm font-bold leading-none text-[#274383]">
          <bdi dir="ltr">{safeValue}%</bdi>
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className="h-full rounded-full bg-[#274383]" style={{ width: `${safeValue}%` }} />
        </div>
      </div>
    </div>
  );
}
