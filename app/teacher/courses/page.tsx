import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { CourseCard } from "@/components/course-card";
import { getTeacherCourses } from "@/app/actions/courses";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";

export default async function TeacherCoursesPage() {
  const result = await getTeacherCourses();

  if (!result.success) {
    return (
      <DashboardShell role="teacher">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Courses
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Manage your classes
            </h1>
          </div>
          <Link
            href="/teacher/create-course"
            className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
          >
            Create course
          </Link>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {result.error}
        </div>
      </DashboardShell>
    );
  }

  const courses = result.courses;

  // Fetch enrolled students count for each course
  const coursesWithStudentCount = await Promise.all(
    courses.map(async (course) => {
      const studentsResult = await getEnrolledStudentsForCourse(course.course_id);
      const studentCount = studentsResult.success
        ? studentsResult.students.length
        : 0;
      return {
        ...course,
        studentCount,
      };
    }),
  );

  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Courses
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Manage your classes
          </h1>
          <p className="text-sm text-slate-500">
            {courses.length === 0
              ? "Create your first course to get started."
              : `You have ${courses.length} course${courses.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link
          href="/teacher/create-course"
          className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
        >
          Create course
        </Link>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start teaching. Click the button above to get started."
        />
      ) : (
        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {coursesWithStudentCount.map((course) => (
            <CourseCard
              key={course.course_id}
              courseId={course.course_id}
              title={course.course_name}
              code={course.course_code}
              teacher={""}
              students={course.studentCount}
              tags={[]}
              href={`/teacher/courses/${course.course_id}`}
            />
          ))}
        </section>
      )}
    </DashboardShell>
  );
}

