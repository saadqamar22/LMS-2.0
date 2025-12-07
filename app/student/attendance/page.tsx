import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getStudentAttendance } from "@/app/actions/attendance";
import { getStudentEnrollments } from "@/app/actions/enrollments";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AttendanceStatus } from "@/app/actions/attendance";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CourseFilter } from "./course-filter";

interface StudentAttendancePageProps {
  searchParams: Promise<{ course?: string }>;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  present: {
    label: "Present",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
  absent: {
    label: "Absent",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
  late: {
    label: "Late",
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
  },
};

export default async function StudentAttendancePage({
  searchParams,
}: StudentAttendancePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { course: selectedCourseId } = await searchParams;
  const [attendanceResult, enrollmentsResult] = await Promise.all([
    getStudentAttendance(selectedCourseId),
    getStudentEnrollments(),
  ]);

  if (!attendanceResult.success) {
    return (
      <DashboardShell role="student">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Attendance
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              My Attendance
            </h1>
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {attendanceResult.error}
        </div>
      </DashboardShell>
    );
  }

  const attendance = attendanceResult.attendance;
  const enrollments = enrollmentsResult.success ? enrollmentsResult.courses : [];

  // Group by course
  const attendanceByCourse = attendance.reduce(
    (acc, entry) => {
      const courseKey = entry.course_id;
      if (!acc[courseKey]) {
        acc[courseKey] = {
          course_name: entry.course_name || "Unknown Course",
          course_code: entry.course_code || "N/A",
          records: [],
        };
      }
      acc[courseKey].records.push(entry);
      return acc;
    },
    {} as Record<
      string,
      {
        course_name: string;
        course_code: string;
        records: typeof attendance;
      }
    >,
  );

  // Calculate statistics
  const totalRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const attendanceRate =
    totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
      : 0;

  return (
    <DashboardShell role="student">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Attendance
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          My Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your attendance records for all enrolled courses
        </p>
      </section>

      {/* Course Filter */}
      {enrollments.length > 0 && (
        <CourseFilter courses={enrollments} selectedCourseId={selectedCourseId} />
      )}

      {totalRecords === 0 ? (
        <EmptyState
          title="No attendance records"
          description="You don't have any attendance records yet. Once your teachers start marking attendance, they will appear here."
        />
      ) : (
        <>
          <section className="mt-8 grid gap-6 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Records
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {totalRecords}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Attendance Rate
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {attendanceRate}%
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Present
              </p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {presentCount}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Absent
              </p>
              <p className="mt-2 text-3xl font-semibold text-red-600">
                {absentCount}
              </p>
            </div>
          </section>

          <section className="mt-8 space-y-6">
            {Object.entries(attendanceByCourse).map(([courseId, courseData]) => (
              <div
                key={courseId}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {courseData.course_code}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {courseData.course_name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {courseData.records.length} record
                    {courseData.records.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  {courseData.records.map((record) => {
                    const config = STATUS_CONFIG[record.status];
                    return (
                      <div
                        key={record.attendance_id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(record.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </DashboardShell>
  );
}

