import { DashboardShell } from "@/components/dashboard-shell";
import { FileUploadCard } from "@/components/file-upload-card";
import { FormInput } from "@/components/form-input";

export default function AIParentReportPage() {
  return (
    <DashboardShell role="parent">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          AI Reports
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Generate parent summary
        </h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <FormInput label="Student" placeholder="Olivia Patel" />
            <FormInput label="Term" placeholder="Fall 2025" />
            <textarea
              rows={8}
              placeholder="Add highlights or concerns..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            />
            <button className="w-full rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
              Generate AI report
            </button>
          </div>
          <div className="space-y-4">
            <FileUploadCard title="Upload supporting docs" />
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Reports include GPA, attendance insights, AI mentor notes, and
              recommended next steps for families.
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

