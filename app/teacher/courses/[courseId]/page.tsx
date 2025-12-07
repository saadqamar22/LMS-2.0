import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { UploadMaterialModal } from "@/components/modals/upload-material-modal";
import { getCourseById } from "@/app/actions/courses";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";
import { Users } from "lucide-react";

interface CourseManagementPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function TeacherCourseDetailPage({
  params,
}: CourseManagementPageProps) {
  const { courseId } = await params;
  const [courseResult, studentsResult] = await Promise.all([
    getCourseById(courseId),
    getEnrolledStudentsForCourse(courseId),
  ]);

  if (!courseResult.success) {
    if (
      courseResult.error.includes("not found") ||
      courseResult.error.includes("permission")
    ) {
      notFound();
    }
    return (
      <DashboardShell role="teacher">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {courseResult.error}
        </div>
      </DashboardShell>
    );
  }

  const course = courseResult.course;
  const students = studentsResult.success ? studentsResult.students : [];

  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {course.course_code}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {course.course_name}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Created {new Date(course.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <UploadMaterialModal />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Link
          href={`/teacher/courses/${courseId}/assignments`}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-slate-900">Assignments</h3>
          <p className="mt-2 text-sm text-slate-500">
            Create and manage assignments
          </p>
        </Link>
        <Link
          href={`/teacher/courses/${courseId}/attendance`}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-slate-900">Attendance</h3>
          <p className="mt-2 text-sm text-slate-500">
            Mark and view student attendance
          </p>
        </Link>
        <Link
          href={`/teacher/courses/${courseId}/marks`}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-slate-900">Marks</h3>
          <p className="mt-2 text-sm text-slate-500">
            Enter and manage student grades
          </p>
        </Link>
        <Link
          href={`/teacher/courses/${courseId}#students`}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-slate-900">Students</h3>
          <p className="mt-2 text-sm text-slate-500">
            {students.length} enrolled student{students.length !== 1 ? "s" : ""}
          </p>
        </Link>
      </section>

      <section id="students" className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Enrollment
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Enrolled Students ({students.length})
            </h2>
          </div>
        </div>

        {students.length === 0 ? (
          <EmptyState
            title="No students enrolled"
            description="No students have enrolled in this course yet."
          />
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registration Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr
                      key={student.student_id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                            <Users className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {student.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {student.registration_number || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/teacher/students/${student.student_id}`}
                          className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="Modules"
          description="Add modules to organize course content. This feature will be available soon."
        />
        <EmptyState
          title="Announcements"
          description="Post announcements for your students. This feature will be available soon."
        />
      </section>
    </DashboardShell>
  );
}

