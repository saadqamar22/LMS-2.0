"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { submitQuizAttempt } from "@/app/actions/quizzes";
import type { Quiz, Question } from "@/app/actions/quizzes";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  quiz: Quiz;
  questions: Question[];
  courseId: string;
}

export function TakeQuizClient({ quiz, questions, courseId }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(
    quiz.time_limit_mins ? quiz.time_limit_mins * 60 : null,
  );

  const handleSubmit = useCallback(async () => {
    setError("");
    setSubmitting(true);
    const res = await submitQuizAttempt(quiz.quiz_id, answers);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
    } else {
      setResult({ score: res.score, total: res.total });
    }
  }, [answers, quiz.quiz_id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, result, handleSubmit]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const pct = result ? Math.round((result.score / result.total) * 100) : 0;

  // ─── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-[var(--shadow-card)]">
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white ${
              pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
            }`}
          >
            {pct}%
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Quiz Submitted!</h2>
          <p className="mt-2 text-slate-500">
            You scored <strong>{result.score}</strong> out of <strong>{result.total}</strong>
          </p>
          <p className={`mt-1 font-semibold ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
            {pct >= 70 ? "Great job!" : pct >= 50 ? "Good effort!" : "Keep practising!"}
          </p>
          <button
            onClick={() => router.push(`/student/courses/${courseId}/quizzes`)}
            className="mt-8 w-full rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const totalAnswered = Object.keys(answers).length;

  // ─── Quiz taking screen ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{quiz.title}</h1>
          <p className="text-sm text-slate-400">
            Question {current + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${timeLeft < 60 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}>
              <Clock className="h-4 w-4" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
          <span className="text-sm text-slate-400">
            {totalAnswered}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-[#4F46E5] transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[var(--shadow-card)]">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {q.marks} mark{q.marks !== 1 ? "s" : ""} · {q.type.replace("_", " ")}
        </p>
        <p className="mt-3 text-lg font-medium text-slate-900">{q.question_text}</p>

        <div className="mt-6 space-y-3">
          {q.type === "mcq" && q.options?.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAnswer(q.question_id, opt)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                answers[q.question_id] === opt
                  ? "border-[#4F46E5] bg-[#EEF2FF] font-medium text-[#4F46E5]"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="mr-3 font-semibold">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}

          {q.type === "true_false" && ["True", "False"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAnswer(q.question_id, opt.toLowerCase())}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                answers[q.question_id] === opt.toLowerCase()
                  ? "border-[#4F46E5] bg-[#EEF2FF] font-medium text-[#4F46E5]"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {opt}
            </button>
          ))}

          {q.type === "short_answer" && (
            <textarea
              rows={3}
              value={answers[q.question_id] || ""}
              onChange={(e) => setAnswer(q.question_id, e.target.value)}
              placeholder="Type your answer here…"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4F46E5]"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                i === current
                  ? "bg-[#4F46E5] text-white"
                  : answers[questions[i].question_id]
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Submit quiz? You have answered ${totalAnswered} of ${questions.length} questions.`)) return;
              handleSubmit();
            }}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
