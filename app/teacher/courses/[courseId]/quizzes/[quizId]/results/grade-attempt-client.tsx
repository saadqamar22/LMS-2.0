"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeManualQuestions } from "@/app/actions/quizzes";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { Question, QuizAttempt } from "@/app/actions/quizzes";

interface Props {
  attempt: QuizAttempt;
  shortAnswerQuestions: Question[];
  totalMarks: number;
}

export function GradeAttemptClient({ attempt, shortAnswerQuestions, totalMarks }: Props) {
  const router = useRouter();
  const answers = (attempt.answers || {}) as Record<string, string>;
  const [marks, setMarks] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    shortAnswerQuestions.forEach((q) => { init[q.question_id] = 0; });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSubmitting(true);
    const result = await gradeManualQuestions(attempt.attempt_id, marks);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {shortAnswerQuestions.map((q) => (
        <div key={q.question_id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Short Answer · {q.marks} mark{q.marks !== 1 ? "s" : ""}
          </p>
          <p className="mt-1 font-medium text-slate-900">{q.question_text}</p>
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Student&apos;s answer</p>
            <p className="mt-0.5 text-sm text-slate-800">
              {answers[q.question_id] || <span className="italic text-slate-400">No answer</span>}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-slate-600">
              Marks awarded (max {q.marks}):
            </label>
            <input
              type="number"
              min={0}
              max={q.marks}
              value={marks[q.question_id] ?? 0}
              onChange={(e) =>
                setMarks((prev) => ({
                  ...prev,
                  [q.question_id]: Math.min(q.marks, Math.max(0, Number(e.target.value))),
                }))
              }
              className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-purple-400"
            />
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <button
        onClick={handleSave}
        disabled={submitting || saved}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
          saved ? "bg-green-600" : "bg-purple-600 hover:bg-purple-700"
        } disabled:opacity-60`}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : null}
        {saved ? "Grades saved" : submitting ? "Saving…" : "Save Grades"}
      </button>
    </div>
  );
}
