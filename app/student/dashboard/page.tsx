import { BookOpenCheck, Calendar, GraduationCap, Timer } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { EmptyState } from "@/components/empty-state";

export default function StudentDashboardPage() {
  return (
    <DashboardShell role="student">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="GPA"
          value="--"
          subtitle="Connect Supabase to see live GPA"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <DashboardCard
          title="Attendance"
          value="--"
          subtitle="Attendance percentages will appear here"
          icon={<Calendar className="h-5 w-5" />}
        />
        <DashboardCard
          title="Courses"
          value="--"
          subtitle="Total enrolled courses"
          icon={<BookOpenCheck className="h-5 w-5" />}
        />
        <DashboardCard
          title="Study hours"
          value="--"
          subtitle="Sync your study tracker to populate"
          icon={<Timer className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <EmptyState
          title="No announcements yet"
          description="Once Supabase tables are connected, course announcements will display in this space."
        />
        <ChatbotWidget />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="Course progress"
          description="Module progress bars will render automatically after wiring this page to Supabase."
        />
        <EmptyState
          title="Upcoming assignments"
          description="Assignments fetched from Supabase will show pending work, due dates, and submission states."
        />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <EmptyState
          title="AI mentor insights"
          description="AI analytics populate when Supabase data feeds the insights service."
        />
        <EmptyState
          title="Collaboration metrics"
          description="Peer sessions and study groups will appear here after integration."
        />
        <EmptyState
          title="Scholarship status"
          description="Eligibility information will be calculated once real academic data is connected."
        />
      </section>
    </DashboardShell>
  );
}

