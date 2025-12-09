import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { UploadMaterialModal } from "@/components/modals/upload-material-modal";
import { getCourseById } from "@/app/actions/courses";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";
import { getAllMarksForCourse } from "@/app/actions/marks";
import { StudentsWithGPA } from "./students-with-gpa";
import type { MarkEntry } from "@/app/actions/marks";

interface CourseManagementPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function TeacherCourseDetailPage({
  params,
}: CourseManagementPageProps) {
  const { courseId } = await params;
  const [courseResult, studentsResult, marksResult] = await Promise.all([
    getCourseById(courseId),
    getEnrolledStudentsForCourse(courseId),
    getAllMarksForCourse(courseId),
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
  const marks = marksResult.success ? marksResult.marks : [];

  // Group marks by student_id
  const studentMarks: Record<string, MarkEntry[]> = {};
  marks.forEach((mark) => {
    if (!studentMarks[mark.student_id]) {
      studentMarks[mark.student_id] = [];
    }
    studentMarks[mark.student_id].push(mark);
  });

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
          <StudentsWithGPA
            students={students}
            studentMarks={studentMarks}
          />
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

