import { DashboardAuditLog } from '@/features/admin/dashboard/components/DashboardAuditLog';
import { DashboardStats } from '@/features/admin/dashboard/components/DashboardStats';
import { DashboardWelcome } from '@/features/admin/dashboard/components/DashboardWelcome';
import { RecentPendingScholarships } from '@/features/admin/dashboard/components/RecentPendingScholarships';

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-[1156px] py-6 lg:py-6">
      <div className="space-y-6">
        <DashboardWelcome />
        <DashboardStats />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(17rem,1fr)]">
          <RecentPendingScholarships />
          <DashboardAuditLog />
        </div>
      </div>
    </div>
  );
}
