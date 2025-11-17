import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

export default function TeacherMarksPage() {
  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Gradebook
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Marks & evaluations
          </h1>
        </div>
      </section>
      <EmptyState
        title="No assessments loaded"
        description="Pull grade records from Supabase and render them here."
      />
    </DashboardShell>
  );
}

