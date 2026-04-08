"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuiz } from "@/app/actions/quizzes";
import { Loader2 } from "lucide-react";

export function CreateQuizForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalMarks, setTotalMarks] = useState(10);
  const [timeLimit, setTimeLimit] = useState("");
  const [gradingMode, setGradingMode] = useState<"auto" | "manual">("auto");
  const [rubric, setRubric] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await createQuiz({
      courseId,
      title,
      description,
      totalMarks,
      timeLimitMins: timeLimit ? parseInt(timeLimit) : undefined,
      gradingMode,
      rubric: rubric || undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
    } else {
      router.push(`/teacher/courses/${courseId}/quizzes/${result.quizId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Quiz Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Chapter 3 Quiz"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional instructions for students"
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Total Marks *</label>
          <input
            type="number"
            min={1}
            value={totalMarks}
            onChange={(e) => setTotalMarks(parseInt(e.target.value) || 1)}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Time Limit (mins)
          </label>
          <input
            type="number"
            min={1}
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="No limit"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Grading Mode */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Grading Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGradingMode("auto")}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              gradingMode === "auto"
                ? "border-purple-400 bg-purple-50 text-purple-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <p className="font-semibold">AI Grade</p>
            <p className="mt-0.5 text-xs opacity-75">
              MCQ &amp; True/False graded instantly. Short answers graded by AI on submission.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setGradingMode("manual")}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              gradingMode === "manual"
                ? "border-purple-400 bg-purple-50 text-purple-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <p className="font-semibold">Manual Grade</p>
            <p className="mt-0.5 text-xs opacity-75">
              MCQ &amp; True/False graded instantly. You review short answers and award marks manually.
            </p>
          </button>
        </div>
      </div>

      {/* Default AI rubric — only for auto mode as quiz-level fallback */}
      {gradingMode === "auto" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Default AI Rubric <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            rows={2}
            placeholder="e.g. Award full marks for complete explanation, partial marks if key concept is mentioned…"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">
            Used as fallback when a short answer question has no individual rubric.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Creating…" : "Create Quiz & Add Questions"}
      </button>
    </form>
  );
}
