import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

export default function TeacherAttendancePage() {
  return (
    <DashboardShell role="teacher">
      <EmptyState
        title="Attendance workflow not wired yet"
        description="Once you build a Supabase query for students in a class, render controls here to mark present/absent/late."
      />
    </DashboardShell>
  );
}

