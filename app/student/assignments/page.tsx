import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

export default function StudentAssignmentsPage() {
  return (
    <DashboardShell role="student">
      <section className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Deliverables
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Assignments workflow
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This view will list assignments once they are fetched from Supabase.
          </p>
        </div>
      </section>
      <EmptyState
        title="No assignments loaded"
        description="Call your Supabase RPC or REST endpoints here and map the results into cards or tables."
      />
    </DashboardShell>
  );
}

