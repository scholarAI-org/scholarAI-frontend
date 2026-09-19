import type { ReactNode } from 'react';

type DashboardStatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

export function DashboardStatCard({ label, value, icon }: DashboardStatCardProps) {
  return (
    <div className="flex min-h-36 items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)]">
      <dl>
        <dt className="text-sm text-[#979797]">{label}</dt>
        <dd className="mt-3 text-2xl font-bold text-[#274383]">{value}</dd>
      </dl>
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-[rgba(249,115,22,0.1)] text-[#f97316]">
        {icon}
      </span>
    </div>
  );
}
