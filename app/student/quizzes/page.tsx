import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getPendingQuizzesForStudent, getPublishedQuizzesByCourse } from "@/app/actions/quizzes";
import { getStudentEnrollments } from "@/app/actions/enrollments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export default async function StudentQuizzesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const [pendingResult, enrollmentsResult] = await Promise.all([
    getPendingQuizzesForStudent(),
    getStudentEnrollments(),
  ]);

  const pendingQuizzes = pendingResult.success ? pendingResult.quizzes : [];
  const enrolledCourses = enrollmentsResult.success ? enrollmentsResult.courses : [];

  // Fetch attempted quizzes per enrolled course
  const attemptedQuizzes = (
    await Promise.all(
      enrolledCourses.map(async (course) => {
        const res = await getPublishedQuizzesByCourse(course.course_id);
        if (!res.success) return [];
        return res.quizzes
          .filter((q) => q.attempted)
          .map((q) => ({ ...q, course_name: course.course_name, course_code: course.course_code }));
      }),
    )
  ).flat();

  return (
    <DashboardShell role="student">
      <section>
        <p className="text-xs uppercase tracking-wide text-slate-400">Quizzes</p>
        <h1 className="text-2xl font-semibold text-slate-900">My Quizzes</h1>
      </section>

      {/* Pending */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Pending</h2>
          <p className="text-sm text-slate-500">Quizzes you haven't attempted yet</p>
        </div>
        {pendingQuizzes.length === 0 ? (
          <EmptyState title="All caught up" description="You have no pending quizzes." />
        ) : (
          <div className="space-y-3">
            {pendingQuizzes.map((quiz) => (
              <div
                key={quiz.quiz_id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{quiz.title}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                      <span>{quiz.course_code} — {quiz.course_name}</span>
                      {quiz.time_limit_mins && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.time_limit_mins} min
                        </span>
                      )}
                      <span>{quiz.total_marks} marks</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/student/courses/${quiz.course_id}/quizzes/${quiz.quiz_id}/take`}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
                >
                  Start <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Attempted */}
      {attemptedQuizzes.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Completed</h2>
            <p className="text-sm text-slate-500">Quizzes you have submitted</p>
          </div>
          <div className="space-y-3">
            {attemptedQuizzes.map((quiz) => {
              const pct = quiz.score !== null ? Math.round((quiz.score / quiz.total_marks) * 100) : null;
              return (
                <div
                  key={quiz.quiz_id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{quiz.title}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                        <span>{(quiz as any).course_code} — {(quiz as any).course_name}</span>
                        {pct !== null && (
                          <span className={`font-semibold ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                            {quiz.score}/{quiz.total_marks} ({pct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/student/courses/${quiz.course_id}/quizzes/${quiz.quiz_id}/result`}
                    className="shrink-0 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                  >
                    View Result
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
