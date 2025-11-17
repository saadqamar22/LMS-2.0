import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

interface TeacherStudentPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function TeacherStudentPage({
  params,
}: TeacherStudentPageProps) {
  const { studentId } = await params;

  return (
    <DashboardShell role="teacher">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Student ID: {studentId}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Student profile pending data
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Fetch the selected student from Supabase (users + students tables) and
          render their academic overview here.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="Grades"
          description="Bind to Supabase marks and display module-level performance."
        />
        <EmptyState
          title="Attendance"
          description="Visualize attendance history using data returned from your attendance table."
        />
      </section>
    </DashboardShell>
  );
}

