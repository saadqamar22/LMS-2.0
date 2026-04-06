import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherCourses } from "@/app/actions/courses";
import Link from "next/link";
import { BookOpen, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default async function TeacherQuizzesPage() {
  const result = await getTeacherCourses();
  const courses = result.success ? result.courses : [];

  return (
    <DashboardShell role="teacher">
      <section>
        <p className="text-xs uppercase tracking-wide text-slate-400">Quizzes</p>
        <h1 className="text-2xl font-semibold text-slate-900">Manage Quizzes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a course below to create and manage its quizzes.
        </p>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create a course first before adding quizzes."
          actionLabel="Create a course"
          actionHref="/teacher/create-course"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.course_id}
              href={`/teacher/courses/${course.course_id}/quizzes`}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="rounded-xl bg-[#EEF2FF] p-2.5 text-[#4F46E5]">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {course.course_code}
                </p>
                <h3 className="mt-0.5 font-semibold text-slate-900 truncate">
                  {course.course_name}
                </h3>
                <p className="mt-1 text-xs text-[#4F46E5] font-medium">
                  Manage quizzes →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
