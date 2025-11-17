import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { EmptyState } from "@/components/empty-state";

export default function AdminAnalyticsPage() {
  return (
    <DashboardShell role="admin">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Active enrollments"
          value="--"
          subtitle="Populate with Supabase metrics"
        />
        <DashboardCard
          title="Attendance avg"
          value="--"
          subtitle="Show global attendance percentage"
        />
        <DashboardCard
          title="Avg GPA"
          value="--"
          subtitle="Drive from aggregated marks"
        />
        <DashboardCard
          title="AI quizzes"
          value="--"
          subtitle="Track AI features usage"
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="GPA chart"
          description="Render GPA trends once you have historical data sources configured."
        />
        <EmptyState
          title="Attendance chart"
          description="Attendance analytics will be displayed here after integrating Supabase data."
        />
      </section>
    </DashboardShell>
  );
}

