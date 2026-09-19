export type DashboardStatistics = {
  pending_scholarships: number;
  published_scholarships: number;
  users: number;
};

export type RecentPendingScholarship = {
  id: number;
  title: string;
  organization_name: string | null;
  country: string | null;
  deadline: string | null;
  no_deadline: boolean | null;
  source: string;
  source_url: string | null;
  status: string;
  scraped_at: string | null;
};

export type RecentPendingScholarshipsResponse = {
  items: RecentPendingScholarship[];
  total: number;
};

export type DashboardAuditLog = {
  id: number;
  admin_id: number | null;
  admin_name: string;
  action: string;
  action_display: string;
  entity_type: string;
  entity_id: number | null;
  entity_name: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type DashboardAuditLogsResponse = {
  items: DashboardAuditLog[];
  total: number;
};

export type DashboardAuditLogsParams = {
  limit: number;
  offset: number;
  action?: string;
};
