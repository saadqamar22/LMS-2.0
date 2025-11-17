import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { EmptyState } from "@/components/empty-state";

export default function ParentDashboardPage() {
  return (
    <DashboardShell role="parent">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Child GPA"
          value="--"
          subtitle="Bind to Supabase GPA calculations"
        />
        <DashboardCard
          title="Attendance"
          value="--"
          subtitle="Show latest attendance percentage"
        />
        <DashboardCard
          title="Courses"
          value="--"
          subtitle="Number of active enrollments"
        />
        <DashboardCard
          title="AI reports"
          value="--"
          subtitle="Display generated reports count"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="GPA trend"
          description="Connect to Supabase analytics or materialized views to plot GPA over time."
        />
        <EmptyState
          title="Attendance overview"
          description="Attendance charts will display once data pipelines are configured."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <EmptyState
          title="Announcements"
          description="Parent announcements and school updates will be listed here."
        />
        <EmptyState
          title="AI insights"
          description="Use Supabase data and AI summaries to provide contextual advice to parents."
        />
      </section>
    </DashboardShell>
  );
}

