import { DashboardShell } from "@/components/dashboard-shell";
import { FileUploadCard } from "@/components/file-upload-card";
import { FormInput } from "@/components/form-input";

export default function AIQuizGeneratorPage() {
  return (
    <DashboardShell role="teacher">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          AI toolkit
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Quiz generator
        </h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <FormInput label="Title" placeholder="Neural nets checkpoint" />
            <textarea
              rows={8}
              placeholder="Paste lecture notes or attach PDFs..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Questions" type="number" min={5} defaultValue={8} />
              <FormInput label="Bloom level" placeholder="Analyze" />
            </div>
            <button className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
              Generate quiz
            </button>
          </div>
          <div className="space-y-4">
            <FileUploadCard title="Attach lecture files" />
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">AI Tip</p>
              <p className="mt-2">
                Provide grading rubrics to auto-tag each question with outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

