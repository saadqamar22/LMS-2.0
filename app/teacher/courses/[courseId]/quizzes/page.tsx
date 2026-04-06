import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseById } from "@/app/actions/courses";
import { getQuizzesByCourse } from "@/app/actions/quizzes";
import { ArrowLeft, Plus, Clock, Users, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function TeacherQuizzesPage({ params }: PageProps) {
  const { courseId } = await params;
  const [courseResult, quizzesResult] = await Promise.all([
    getCourseById(courseId),
    getQuizzesByCourse(courseId),
  ]);

  if (!courseResult.success) notFound();

  const course = courseResult.course;
  const quizzes = quizzesResult.success ? quizzesResult.quizzes : [];

  return (
    <DashboardShell role="teacher">
      <section className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/teacher/courses/${courseId}`}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">{course.course_code}</p>
            <h1 className="text-2xl font-semibold text-slate-900">Quizzes</h1>
          </div>
        </div>
        <Link
          href={`/teacher/courses/${courseId}/quizzes/create`}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          New Quiz
        </Link>
      </section>

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes yet"
          description="Create your first quiz for this course."
          actionLabel="Create Quiz"
          actionHref={`/teacher/courses/${courseId}/quizzes/create`}
        />
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.quiz_id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">{quiz.title}</h3>
                  {quiz.is_published ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <Eye className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      <EyeOff className="h-3 w-3" /> Draft
                    </span>
                  )}
                </div>
                {quiz.description && (
                  <p className="mt-1 text-sm text-slate-500 truncate">{quiz.description}</p>
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
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {quiz.attempt_count} submission{quiz.attempt_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/teacher/courses/${courseId}/quizzes/${quiz.quiz_id}/results`}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Results
                </Link>
                <Link
                  href={`/teacher/courses/${courseId}/quizzes/${quiz.quiz_id}`}
                  className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
