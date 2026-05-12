import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getChildAttendance } from "@/app/actions/attendance";
import { verifyChildAccess } from "@/app/actions/parents";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AttendanceStatus } from "@/app/actions/attendance";

interface ChildAttendancePageProps {
  params: Promise<{ childId: string }>;
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

export default async function ChildAttendancePage({
  params,
}: ChildAttendancePageProps) {
  const { childId } = await params;
  const [accessResult, attendanceResult] = await Promise.all([
    verifyChildAccess(childId),
    getChildAttendance(childId),
  ]);

  if ("success" in accessResult) {
    notFound();
  }

  if (!accessResult.hasAccess) {
    notFound();
  }

  if (!attendanceResult.success) {
    return (
      <DashboardShell role="parent">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/parent/children"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to children
            </Link>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {accessResult.childName}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
          </div>
        </section>
        <div className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {attendanceResult.error}
        </div>
      </DashboardShell>
    );
  }

  const attendance = attendanceResult.attendance;

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
    <DashboardShell role="parent">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/parent/children"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to children
          </Link>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {accessResult.childName}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500">
            View attendance records for your child
          </p>
        </div>
      </section>

      {totalRecords === 0 ? (
        <EmptyState
          title="No attendance records"
          description="Your child doesn't have any attendance records yet. Once teachers start marking attendance, they will appear here."
        />
      ) : (
        <>
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500">
                Combined Statistics
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Overall Attendance
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">
                  Total Records
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                  {totalRecords}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">
                  Attendance Rate
                </p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${attendanceRate < 80 ? "text-red-600" : "text-slate-900"}`}>
                  {attendanceRate}%
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">
                  Present
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-green-600">
                  {presentCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">
                  Absent
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-red-600">
                  {absentCount}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 space-y-6">
            {Object.entries(attendanceByCourse).map(([courseId, courseData]) => {
              // Calculate course-specific statistics
              const courseRecords = courseData.records;
              const coursePresentCount = courseRecords.filter((a) => a.status === "present").length;
              const courseAbsentCount = courseRecords.filter((a) => a.status === "absent").length;
              const courseLateCount = courseRecords.filter((a) => a.status === "late").length;
              const courseAttendanceRate =
                courseRecords.length > 0
                  ? Math.round(((coursePresentCount + courseLateCount) / courseRecords.length) * 100)
                  : 0;

              return (
                <div
                  key={courseId}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        {courseData.course_code}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {courseData.course_name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-semibold ${courseAttendanceRate < 80 ? "text-red-600" : "text-slate-900"}`}>
                        {courseAttendanceRate}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {coursePresentCount + courseLateCount} / {courseRecords.length} present
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-green-50 p-3">
                      <p className="text-xs text-slate-500">Present</p>
                      <p className="text-lg font-semibold text-green-700">{coursePresentCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-yellow-50 p-3">
                      <p className="text-xs text-slate-500">Late</p>
                      <p className="text-lg font-semibold text-yellow-700">{courseLateCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-red-50 p-3">
                      <p className="text-xs text-slate-500">Absent</p>
                      <p className="text-lg font-semibold text-red-700">{courseAbsentCount}</p>
                    </div>
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
              );
            })}
          </section>
        </>
      )}
    </DashboardShell>
  );
}
