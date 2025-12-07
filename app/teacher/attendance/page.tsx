import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherCourses } from "@/app/actions/courses";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { EmptyState } from "@/components/empty-state";
import { AttendanceClient } from "./attendance-client";

interface TeacherAttendancePageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function TeacherAttendancePage({
  searchParams,
}: TeacherAttendancePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { course: selectedCourseId } = await searchParams;
  const coursesResult = await getTeacherCourses();

  if (!coursesResult.success) {
    return (
      <DashboardShell role="teacher">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {coursesResult.error}
        </div>
      </DashboardShell>
    );
  }

  const courses = coursesResult.courses;

  return (
    <DashboardShell role="teacher">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Attendance Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Mark Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a course to mark and view attendance for enrolled students
        </p>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create a course first to start marking attendance."
        />
      ) : (
        <AttendanceClient
          courses={courses}
          initialSelectedCourseId={selectedCourseId}
        />
      )}
    </DashboardShell>
  );
}
