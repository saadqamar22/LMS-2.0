import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCourseById } from "@/app/actions/courses";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";
import {
  getAttendanceForDate,
  getAttendanceHistory,
} from "@/app/actions/attendance";
import { AttendanceForm } from "./attendance-form";

interface AttendancePageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function TeacherAttendancePage({
  params,
  searchParams,
}: AttendancePageProps) {
  const { courseId } = await params;
  const { date } = await searchParams;

  // Default to today's date if not provided
  const selectedDate = date || new Date().toISOString().split("T")[0];

  const [courseResult, studentsResult, attendanceResult, historyResult] =
    await Promise.all([
      getCourseById(courseId),
      getEnrolledStudentsForCourse(courseId),
      getAttendanceForDate(courseId, selectedDate),
      getAttendanceHistory(courseId),
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
  const existingAttendance = attendanceResult.success
    ? attendanceResult.attendance
    : [];

  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href={`/teacher/courses/${courseId}`}
            className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            ← Back to course
          </Link>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
            {course.course_code}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Mark Attendance
          </h1>
        </div>
      </section>

      {students.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
          No students enrolled in this course yet. Students must enroll before
          you can mark attendance.
        </div>
      ) : (
        <AttendanceForm
          courseId={courseId}
          students={students}
          selectedDate={selectedDate}
          existingAttendance={existingAttendance}
          history={historyResult.success ? historyResult.history : []}
        />
      )}
    </DashboardShell>
  );
}

