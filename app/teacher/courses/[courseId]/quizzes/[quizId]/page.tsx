import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getQuizWithQuestions } from "@/app/actions/quizzes";
import { QuizManageClient } from "./quiz-manage-client";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function TeacherQuizManagePage({ params }: PageProps) {
  const { courseId, quizId } = await params;
  const result = await getQuizWithQuestions(quizId);
  if (!result.success) notFound();

  const { quiz, questions } = result;

  return (
    <DashboardShell role="teacher">
      <section className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/teacher/courses/${courseId}/quizzes`}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{quiz.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {quiz.total_marks} marks
              </span>
              {quiz.time_limit_mins && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {quiz.time_limit_mins} min
                </span>
              )}
              <span className={quiz.is_published ? "text-green-600 font-medium" : "text-slate-400"}>
                {quiz.is_published ? "Published" : "Draft"}
              </span>
            </div>
          </div>
        </div>
        <QuizManageClient
          quizId={quizId}
          courseId={courseId}
          isPublished={quiz.is_published}
          mode="publish-toggle"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Add Question Form */}
        {!quiz.is_published && (
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Add Question</h2>
              <QuizManageClient quizId={quizId} courseId={courseId} isPublished={false} mode="add-question" />
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className={quiz.is_published ? "lg:col-span-3" : "lg:col-span-2"}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Questions ({questions.length})
            </h2>
            {quiz.is_published && (
              <Link
                href={`/teacher/courses/${courseId}/quizzes/${quizId}/results`}
                className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
              >
                View Results
              </Link>
            )}
          </div>

          {questions.length === 0 ? (
            <EmptyState title="No questions yet" description="Add questions using the form on the left." />
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.question_id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Q{i + 1} · {q.marks} mark{q.marks !== 1 ? "s" : ""} · <span className="uppercase">{q.type.replace("_", " ")}</span></p>
                      <p className="mt-1 text-slate-900">{q.question_text}</p>
                      {q.type === "mcq" && q.options && (
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, j) => (
                            <li
                              key={j}
                              className={`rounded-lg px-3 py-1.5 text-sm ${opt === q.correct_answer ? "bg-green-50 text-green-700 font-medium" : "text-slate-600"}`}
                            >
                              {String.fromCharCode(65 + j)}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.type === "true_false" && (
                        <p className="mt-2 text-sm text-slate-500">
                          Answer: <span className="font-medium text-green-700 capitalize">{q.correct_answer}</span>
                        </p>
                      )}
                      {q.type === "short_answer" && (
                        <p className="mt-2 text-sm text-slate-500">
                          Expected: <span className="font-medium text-green-700">{q.correct_answer}</span>
                        </p>
                      )}
                    </div>
                    {!quiz.is_published && (
                      <QuizManageClient
                        quizId={quizId}
                        courseId={courseId}
                        isPublished={false}
                        mode="delete-question"
                        questionId={q.question_id}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
