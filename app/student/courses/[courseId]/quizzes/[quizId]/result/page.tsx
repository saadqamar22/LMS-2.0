import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getStudentQuizResult } from "@/app/actions/quizzes";
import { ArrowLeft, CheckCircle2, XCircle, Clock, HelpCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function StudentQuizResultPage({ params }: PageProps) {
  const { courseId, quizId } = await params;
  const result = await getStudentQuizResult(quizId);

  if (!result.success) notFound();

  const { quiz, questions, attempt } = result;
  const score = attempt.score ?? 0;
  const pct = Math.round((score / quiz.total_marks) * 100);
  const answers = (attempt.answers || {}) as Record<string, string>;

  const isManual = quiz.grading_mode === "manual";
  const hasPendingManual = isManual && questions.some((q) => q.type === "short_answer");

  return (
    <DashboardShell role="student">
      {/* Header */}
      <section className="flex items-center gap-4">
        <Link
          href={`/student/courses/${courseId}/quizzes`}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{quiz.title} — Result</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Submitted {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : ""}
          </p>
        </div>
      </section>

      {/* Score card */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={`text-5xl font-bold ${
              pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"
            }`}
          >
            {score}/{quiz.total_marks}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              pct >= 70
                ? "bg-green-50 text-green-700"
                : pct >= 50
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {pct}% — {pct >= 70 ? "Passed" : pct >= 50 ? "Average" : "Needs improvement"}
          </div>
          {hasPendingManual && (
            <p className="mt-2 text-xs text-slate-500">
              Short answer questions are graded manually by your teacher. Score may increase after review.
            </p>
          )}
        </div>
      </section>

      {/* Question breakdown */}
      <section>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Review</p>
          <h2 className="text-xl font-semibold text-slate-900">Answer Breakdown</h2>
        </div>

        <div className="space-y-4">
          {questions.map((question, idx) => {
            const studentAnswer = answers[question.question_id] || "";
            const isShortAnswer = question.type === "short_answer";
            const isCorrect =
              !isShortAnswer &&
              studentAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
            const isWrong = !isShortAnswer && !isCorrect;

            return (
              <div
                key={question.question_id}
                className={`rounded-2xl border p-5 ${
                  isShortAnswer
                    ? "border-slate-200 bg-white"
                    : isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Question {idx + 1} · {question.marks} mark{question.marks !== 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{question.question_text}</p>

                    {/* MCQ options */}
                    {question.type === "mcq" && question.options && (
                      <div className="mt-3 space-y-1.5">
                        {question.options.map((opt, i) => {
                          const isSelected = studentAnswer === opt;
                          const isCorrectOpt = opt === question.correct_answer;
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                isCorrectOpt
                                  ? "bg-green-100 text-green-800 font-medium"
                                  : isSelected && !isCorrectOpt
                                  ? "bg-red-100 text-red-700"
                                  : "bg-white text-slate-600"
                              }`}
                            >
                              {isCorrectOpt ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                              ) : isSelected ? (
                                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                              ) : (
                                <span className="h-4 w-4 shrink-0" />
                              )}
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False */}
                    {question.type === "true_false" && (
                      <div className="mt-3 space-y-1.5">
                        {["True", "False"].map((opt) => {
                          const isSelected = studentAnswer.toLowerCase() === opt.toLowerCase();
                          const isCorrectOpt =
                            opt.toLowerCase() === question.correct_answer.toLowerCase();
                          return (
                            <div
                              key={opt}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                isCorrectOpt
                                  ? "bg-green-100 text-green-800 font-medium"
                                  : isSelected && !isCorrectOpt
                                  ? "bg-red-100 text-red-700"
                                  : "bg-white text-slate-600"
                              }`}
                            >
                              {isCorrectOpt ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                              ) : isSelected ? (
                                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                              ) : (
                                <span className="h-4 w-4 shrink-0" />
                              )}
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short answer */}
                    {question.type === "short_answer" && (
                      <div className="mt-3 space-y-2">
                        <div className="rounded-lg bg-slate-100 px-3 py-2">
                          <p className="text-xs text-slate-400">Your answer</p>
                          <p className="mt-0.5 text-sm text-slate-800">
                            {studentAnswer || <span className="italic text-slate-400">No answer provided</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          Pending teacher review
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status icon (non short_answer) */}
                  {!isShortAnswer && (
                    <div className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  )}
                  {isShortAnswer && (
                    <div className="shrink-0">
                      <HelpCircle className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Show correct answer for wrong MCQ/T-F */}
                {isWrong && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                    <span className="font-medium text-green-700">Correct answer: </span>
                    <span className="text-green-800">{question.correct_answer}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
