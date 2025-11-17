import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseDetailsForStudent } from "@/app/actions/enrollments";
import { EnrollButton } from "../enroll-button";
import { BookOpen, CheckCircle2, User } from "lucide-react";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseDetailPage({
  params,
}: CoursePageProps) {
  const { courseId } = await params;
  const result = await getCourseDetailsForStudent(courseId);

  if (!result.success) {
    if (result.error.includes("not found")) {
      notFound();
    }
    return (
      <DashboardShell role="student">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {result.error}
        </div>
      </DashboardShell>
    );
  }

  const { course, modules, isEnrolled } = result;

  return (
    <DashboardShell role="student">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {course.course_code}
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {course.course_name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {course.teacher_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Instructor: {course.teacher_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>
                  Created {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEnrolled ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Enrolled
              </div>
            ) : (
              <EnrollButton courseId={courseId} />
            )}
            <Link
              href="/student/courses"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to courses
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Course content
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Modules ({modules.length})
            </h2>
          </div>
        </div>

        {modules.length === 0 ? (
          <EmptyState
            title="No modules yet"
            description="This course doesn't have any modules yet. Check back later."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.module_id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#EEF2FF] p-2 text-[#4F46E5]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {module.module_name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Total marks: {module.total_marks}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isEnrolled && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Link
            href={`/student/attendance?course=${courseId}`}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold text-slate-900">Attendance</h3>
            <p className="mt-2 text-sm text-slate-500">
              View your attendance records for this course
            </p>
          </Link>
          <Link
            href={`/student/marks?course=${courseId}`}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold text-slate-900">Marks</h3>
            <p className="mt-2 text-sm text-slate-500">
              View your grades and marks for this course
            </p>
          </Link>
        </section>
      )}
    </DashboardShell>
  );
}

