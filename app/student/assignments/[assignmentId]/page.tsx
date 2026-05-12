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
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium text-slate-500">
          Assignment ID: {assignmentId}
        </p>
        <h1 className="text-2xl font-bold tabular-nums text-slate-900">
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

