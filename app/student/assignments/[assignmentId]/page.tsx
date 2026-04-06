import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

interface AssignmentPageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function StudentAssignmentDetailPage({
  params,
}: AssignmentPageProps) {
  const { assignmentId } = await params;

  return (
    <DashboardShell role="student">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Assignment ID: {assignmentId}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Assignment details pending integration
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Pull the assignment record from Supabase (e.g., assignments table) and
          render metadata, instructions, and due dates here.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="Submission section"
          description="Wire this area to your submission workflow or Supabase storage uploads."
        />
        <EmptyState
          title="Rubric"
          description="Display rubric rows, grading criteria, or AI feedback based on actual data."
        />
      </section>
    </DashboardShell>
  );
}

