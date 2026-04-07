import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { getParentChildren } from "@/app/actions/parents";
import { ParentReportClient } from "./parent-report-client";

export default async function AIParentReportPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  if (currentUser.role !== "parent") {
    return (
      <DashboardShell role={currentUser.role as "student" | "teacher" | "parent" | "admin"}>
        <EmptyState title="Parents only" description="AI Progress Reports are only available to parents." />
      </DashboardShell>
    );
  }

  const childrenResult = await getParentChildren();
  const children = childrenResult.success ? childrenResult.children : [];

  return (
    <DashboardShell role="parent">
      <section>
        <p className="text-xs uppercase tracking-wide text-slate-400">AI Tools</p>
        <h1 className="text-2xl font-semibold text-slate-900">AI Progress Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate a detailed, AI-written progress report for your child based on their marks and attendance.
        </p>
      </section>

      {children.length === 0 ? (
        <EmptyState
          title="No children linked"
          description="No children are linked to your account. Contact the administrator to link your children."
        />
      ) : (
        <ParentReportClient children={children} />
      )}
    </DashboardShell>
  );
}
