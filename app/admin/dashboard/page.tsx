import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { EmptyState } from "@/components/empty-state";

export default function AdminDashboardPage() {
  return (
    <DashboardShell role="admin">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total students"
          value="--"
          subtitle="Bind to Supabase counts"
        />
        <DashboardCard
          title="Teachers"
          value="--"
          subtitle="Full & part-time totals"
        />
        <DashboardCard
          title="Active courses"
          value="--"
          subtitle="Show total published courses"
        />
        <DashboardCard
          title="AI reports"
          value="--"
          subtitle="Generated reports in Supabase"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="System analytics"
          description="Replace this placeholder with charts sourced from Supabase or your analytics warehouse."
        />
        <EmptyState
          title="Attendance overview"
          description="Render campus-wide attendance metrics once you have real data."
        />
      </section>

      <EmptyState
        title="Recently added users"
        description="Query Supabase (users + roles) to list the latest accounts."
        actionLabel="Manage users"
        actionHref="/admin/users"
      />
    </DashboardShell>
  );
}

