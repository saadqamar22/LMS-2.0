import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

export default function TeacherStudentsPage() {
  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Students
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Cohort roster
          </h1>
        </div>
        <Link
          href="/teacher/analytics"
          className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white"
        >
          View analytics
        </Link>
      </section>
      <EmptyState
        title="No students loaded"
        description="Fetch students from Supabase and pass them into your roster table."
      />
    </DashboardShell>
  );
}

