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
            <p className="text-xs uppercase tracking-wide text-slate-400">Courses</p>
            <h1 className="text-2xl font-semibold text-slate-900">My Courses</h1>
          </div>
          <Link
            href="/teacher/create-course"
            className="self-start rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            + Create Course
          </Link>
        </section>
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
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
          <p className="text-xs uppercase tracking-wide text-slate-400">Courses</p>
          <h1 className="text-2xl font-semibold text-slate-900">My Courses</h1>
        </div>
        <Link
          href="/teacher/create-course"
          className="self-start rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
        >
          + Create Course
        </Link>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start teaching."
          actionLabel="Create Course"
          actionHref="/teacher/create-course"
        />
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

