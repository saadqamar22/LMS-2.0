import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { CourseCard } from "@/components/course-card";
import {
  getAvailableCourses,
  getStudentEnrollments,
} from "@/app/actions/enrollments";
import { EnrollButton } from "./enroll-button";

export default async function StudentCoursesPage() {
  const [availableCoursesResult, enrollmentsResult] = await Promise.all([
    getAvailableCourses(),
    getStudentEnrollments(),
  ]);

  const enrolledCourseIds = new Set<string>();
  if (enrollmentsResult.success) {
    enrollmentsResult.enrollments.forEach((e) => {
      enrolledCourseIds.add(e.course_id);
    });
  }

  if (!availableCoursesResult.success) {
    return (
      <DashboardShell role="student">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Learning journey
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Browse courses
            </h1>
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {availableCoursesResult.error}
        </div>
      </DashboardShell>
    );
  }

  const courses = availableCoursesResult.courses;
  const enrolledCourses =
    enrollmentsResult.success ? enrollmentsResult.courses : [];

  return (
    <DashboardShell role="student">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Learning journey
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Browse courses
          </h1>
          <p className="text-sm text-slate-500">
            {courses.length === 0
              ? "No courses available yet."
              : `Browse ${courses.length} available course${courses.length === 1 ? "" : "s"}.`}
          </p>
        </div>
      </section>

      {enrolledCourses.length > 0 && (
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Your enrollments
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Enrolled courses ({enrolledCourses.length})
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {enrolledCourses.map((course) => (
              <CourseCard
                key={course.course_id}
                courseId={course.course_id}
                title={course.course_name}
                code={course.course_code}
                teacher={course.teacher_name || "TBA"}
                students={0}
                progress={0}
                tags={[]}
                href={`/student/courses/${course.course_id}`}
              />
            ))}
          </div>
        </section>
      )}

      <section className={enrolledCourses.length > 0 ? "mt-12" : "mt-8"}>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Available courses
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            All courses ({courses.length})
          </h2>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            title="No courses available"
            description="There are no courses available to enroll in at the moment."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.course_id);
              return (
                <div key={course.course_id} className="relative">
                  <CourseCard
                    courseId={course.course_id}
                    title={course.course_name}
                    code={course.course_code}
                    teacher={course.teacher_name || "TBA"}
                    students={0}
                    progress={0}
                    tags={[]}
                    href={`/student/courses/${course.course_id}`}
                  />
                  {!isEnrolled && (
                    <div className="absolute bottom-4 right-4">
                      <EnrollButton courseId={course.course_id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

