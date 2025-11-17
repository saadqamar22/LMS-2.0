import { DashboardShell } from "@/components/dashboard-shell";
import { FileUploadCard } from "@/components/file-upload-card";
import { FormInput } from "@/components/form-input";
import { EmptyState } from "@/components/empty-state";

export default function TeacherQuizzesPage() {
  return (
    <DashboardShell role="teacher">
      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            AI Generator
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Create quiz with AI
          </h1>
          <div className="mt-6 space-y-4">
            <FormInput label="Quiz title" placeholder="Enter quiz name" />
            <textarea
              rows={6}
              placeholder="Paste lecture notes or outcomes..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Number of questions" type="number" min={1} />
              <FormInput label="Difficulty" placeholder="e.g., intermediate" />
            </div>
            <button className="w-full rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
              Generate quiz
            </button>
          </div>
        </div>
        <EmptyState
          title="No AI quizzes yet"
          description="When you store quiz attempts or metadata in Supabase, surface them here."
          actionLabel="View Supabase docs"
          actionHref="https://supabase.com/docs"
        />
      </section>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-slate-900">Upload quiz</h2>
        <p className="text-sm text-slate-500">
          Use Supabase storage or your own API to ingest quiz files. This UI is
          ready for integration.
        </p>
        <div className="mt-4">
          <FileUploadCard />
        </div>
      </section>
    </DashboardShell>
  );
}

