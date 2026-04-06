import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getQuizWithQuestions, getQuizAttempts } from "@/app/actions/quizzes";
import { PostMarksButton } from "./post-marks-button";
import { GradeAttemptClient } from "./grade-attempt-client";
import { ArrowLeft, CheckCircle2, ChevronDown } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function QuizResultsPage({ params }: PageProps) {
  const { courseId, quizId } = await params;
  const [quizResult, attemptsResult] = await Promise.all([
    getQuizWithQuestions(quizId),
    getQuizAttempts(quizId),
  ]);

  if (!quizResult.success) notFound();

  const { quiz, questions } = quizResult;
  const attempts = attemptsResult.success ? attemptsResult.attempts : [];

  const alreadyPosted = quiz.module_id !== null;
  const isManual = quiz.grading_mode === "manual";
  const shortAnswerQuestions = questions.filter((q) => q.type === "short_answer");

  const avgScore =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length) * 10,
        ) / 10
      : 0;

  return (
    <DashboardShell role="teacher">
      <section className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/teacher/courses/${courseId}/quizzes/${quizId}`}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">{quiz.title} — Results</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isManual
                    ? "bg-amber-50 text-amber-700"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                {isManual ? "Manual Grading" : "Auto Grading"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              {attempts.length} submission{attempts.length !== 1 ? "s" : ""}
              {attempts.length > 0 && ` · Avg: ${avgScore}/${quiz.total_marks}`}
            </p>
          </div>
        </div>
        {attempts.length > 0 && (
          <PostMarksButton quizId={quizId} courseId={courseId} alreadyPosted={alreadyPosted} />
        )}
      </section>

      {/* Rubric (if set) */}
      {quiz.rubric && (
        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Rubric</p>
          <p className="mt-1 text-sm text-amber-900 whitespace-pre-wrap">{quiz.rubric}</p>
        </section>
      )}

      {attempts.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="No students have submitted this quiz yet."
        />
      ) : (
        <>
          {/* Scores table */}
          <div className="rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Student</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Reg. No.</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-600">Score</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-600">Percentage</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attempts.map((attempt) => {
                  const pct =
                    attempt.score !== null
                      ? Math.round((attempt.score / quiz.total_marks) * 100)
                      : null;
                  return (
                    <tr key={attempt.attempt_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {attempt.student_name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {attempt.registration_number || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {attempt.score !== null ? (
                          <span className="font-semibold text-slate-900">
                            {attempt.score}/{quiz.total_marks}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {pct !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              pct >= 70
                                ? "bg-green-50 text-green-700"
                                : pct >= 50
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {pct}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {attempt.submitted_at
                          ? new Date(attempt.submitted_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Manual grading panels — one per student, shown only if manual + short_answer questions exist */}
          {isManual && shortAnswerQuestions.length > 0 && (
            <section>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Manual Grading</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Grade Short Answer Questions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review each student&apos;s short answer responses and award marks. Saving will update their total score.
                </p>
              </div>
              <div className="space-y-6">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.attempt_id}
                    className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{attempt.student_name}</p>
                        <p className="text-xs text-slate-400">
                          {attempt.registration_number || "No reg. number"} ·{" "}
                          Current score: {attempt.score ?? 0}/{quiz.total_marks}
                        </p>
                      </div>
                    </div>
                    <GradeAttemptClient
                      attempt={attempt}
                      shortAnswerQuestions={shortAnswerQuestions}
                      totalMarks={quiz.total_marks}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  );
}
