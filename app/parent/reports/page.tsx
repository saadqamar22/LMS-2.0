import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { FileUploadCard } from "@/components/file-upload-card";

export default function ParentReportsPage() {
  return (
    <DashboardShell role="parent">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              AI Reports
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Insight archive
            </h1>
            <p className="text-sm text-slate-500">
              Once Supabase data is connected, list past reports and teacher
              notes here.
            </p>
          </div>
          <button className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
            Generate new
          </button>
        </div>
        <EmptyState
          title="No reports yet"
          description="Query your parent reports table and render each record as a card or row."
        />
      </section>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-slate-900">Share files</h2>
        <p className="text-sm text-slate-500">
          Hook this upload control to Supabase storage to share documents with
          teachers or AI assistants.
        </p>
        <div className="mt-4">
          <FileUploadCard />
        </div>
      </section>
    </DashboardShell>
  );
}

