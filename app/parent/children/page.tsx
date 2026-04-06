import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getParentChildren } from "@/app/actions/parents";
import { Users } from "lucide-react";

export default async function ParentChildrenPage() {
  const result = await getParentChildren();

  if (!result.success) {
    return (
      <DashboardShell role="parent">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Family view
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Children overview
            </h1>
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {result.error}
        </div>
      </DashboardShell>
    );
  }

  const children = result.children;

  return (
    <DashboardShell role="parent">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Family view
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Children overview
          </h1>
          <p className="text-sm text-slate-500">
            {children.length === 0
              ? "No children linked to your account."
              : `Viewing ${children.length} child${children.length !== 1 ? "ren" : ""}`}
          </p>
        </div>
      </section>

      {children.length === 0 ? (
        <EmptyState
          title="No linked children"
          description="No children are currently linked to your account. Contact the administrator to link your children."
        />
      ) : (
        <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div
              key={child.student_id}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {child.full_name}
                  </h3>
                  {child.registration_number && (
                    <p className="text-sm text-slate-500">
                      {child.registration_number}
                    </p>
                  )}
                  {child.class && child.section && (
                    <p className="text-xs text-slate-400">
                      {child.class} - {child.section}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href={`/parent/child/${child.student_id}/marks`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View Marks
                </Link>
                <Link
                  href={`/parent/child/${child.student_id}/attendance`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View Attendance
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}

