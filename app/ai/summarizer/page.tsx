import { DashboardShell } from "@/components/dashboard-shell";
import { FileUploadCard } from "@/components/file-upload-card";

export default function AISummarizerPage() {
  return (
    <DashboardShell role="student">
      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            AI toolkit
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Lecture summarizer
          </h1>
          <textarea
            rows={12}
            placeholder="Paste lecture transcript, meeting notes, or copy your handwritten summary..."
            className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
          />
          <button className="mt-4 w-full rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
            Summarize with AI
          </button>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Output preview will include bullet insights, next questions, and
            spaced-repetition reminders.
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-slate-900">Upload files</h2>
          <p className="text-sm text-slate-500">
            Drop PDFs, slides, or audio files. The AI pipeline auto-transcribes
            and summarizes.
          </p>
          <div className="mt-4">
            <FileUploadCard />
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

