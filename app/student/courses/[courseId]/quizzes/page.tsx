import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseById } from "@/app/actions/courses";
import { getPublishedQuizzesByCourse } from "@/app/actions/quizzes";
import { ArrowLeft, Clock, CheckCircle2, ClipboardCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function StudentQuizzesPage({ params }: PageProps) {
  const { courseId } = await params;
  const [courseResult, quizzesResult] = await Promise.all([
    getCourseById(courseId),
    getPublishedQuizzesByCourse(courseId),
  ]);

  if (!courseResult.success) notFound();

  const course = courseResult.course;
  const quizzes = quizzesResult.success ? quizzesResult.quizzes : [];

  return (
    <DashboardShell role="student">
      <section className="flex items-center gap-4">
        <Link
          href={`/student/courses/${courseId}`}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{course.course_code}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Quizzes</h1>
        </div>
      </section>

      {quizzes.length === 0 ? (
        <EmptyState title="No quizzes yet" description="Your teacher hasn't published any quizzes for this course yet." />
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.quiz_id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-2.5 ${quiz.attempted ? "bg-green-50 text-green-600" : "bg-[#EEF2FF] text-[#4F46E5]"}`}>
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{quiz.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {quiz.total_marks} marks
                    </span>
                    {quiz.time_limit_mins && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {quiz.time_limit_mins} min
                      </span>
                    )}
                    {quiz.attempted && quiz.score !== null && (
                      <span className="font-medium text-green-600">
                        Your score: {quiz.score}/{quiz.total_marks} ({Math.round((quiz.score / quiz.total_marks) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {quiz.attempted ? (
                <Link
                  href={`/student/courses/${courseId}/quizzes/${quiz.quiz_id}/result`}
                  className="shrink-0 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                >
                  View Result
                </Link>
              ) : (
                <Link
                  href={`/student/courses/${courseId}/quizzes/${quiz.quiz_id}/take`}
                  className="shrink-0 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
                >
                  Start Quiz
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
