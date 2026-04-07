import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getParentChildren } from "@/app/actions/parents";
import { getChildMarks } from "@/app/actions/marks";
import { getChildAttendance } from "@/app/actions/attendance";
import Link from "next/link";
import { getParentAnnouncements } from "@/app/actions/announcements";
import { AnnouncementCard } from "@/components/announcement-card";
import { calculateGPAFromMarks } from "@/lib/utils/gpa-calculator";
import { Users, BarChart3, Calendar, Megaphone, GraduationCap, BookOpen } from "lucide-react";

export default async function ParentDashboardPage() {
  const [childrenResult, announcementsResult] = await Promise.all([
    getParentChildren(),
    getParentAnnouncements(),
  ]);

  if (!childrenResult.success || childrenResult.children.length === 0) {
    return (
      <DashboardShell role="parent">
        <EmptyState
          title="No children linked"
          description="No children are currently linked to your account. Contact the administrator to link your children."
        />
      </DashboardShell>
    );
  }

  const children = childrenResult.children;
  const announcements = announcementsResult.success
    ? announcementsResult.announcements.slice(0, 3)
    : [];

  // Fetch marks + attendance for every child in parallel
  const childData = await Promise.all(
    children.map(async (child) => {
      const [marksResult, attendanceResult] = await Promise.all([
        getChildMarks(child.student_id),
        getChildAttendance(child.student_id),
      ]);

      const marks = marksResult.success ? marksResult.marks : [];
      const attendance = attendanceResult.success ? attendanceResult.attendance : [];

      const { gpa, percentage } = calculateGPAFromMarks(marks);

      const totalRecords = attendance.length;
      const presentCount = attendance.filter((a) => a.status === "present").length;
      const lateCount = attendance.filter((a) => a.status === "late").length;
      const attendanceRate =
        totalRecords > 0
          ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
          : null;

      // Unique courses from marks
      const uniqueCourses = new Set(
        marks.map((m) => m.course_code).filter(Boolean),
      ).size;

      return { child, gpa, percentage, attendanceRate, totalRecords, uniqueCourses };
    }),
  );

  // Aggregate totals for top stat cards
  const totalCourses = childData.reduce((s, d) => s + d.uniqueCourses, 0);
  const avgAttendance =
    childData.filter((d) => d.attendanceRate !== null).length > 0
      ? Math.round(
          childData
            .filter((d) => d.attendanceRate !== null)
            .reduce((s, d) => s + (d.attendanceRate ?? 0), 0) /
            childData.filter((d) => d.attendanceRate !== null).length,
        )
      : null;

  return (
    <DashboardShell role="parent">
      {/* Top stats */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Children</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{children.length}</p>
              <p className="mt-1 text-xs text-slate-400">Linked accounts</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Courses</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalCourses}</p>
              <p className="mt-1 text-xs text-slate-400">Across all children</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Attendance</p>
              <p className={`mt-2 text-3xl font-semibold ${avgAttendance !== null && avgAttendance < 80 ? "text-red-600" : "text-slate-900"}`}>
                {avgAttendance !== null ? `${avgAttendance}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Combined average</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Per-child cards */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Children</p>
            <h2 className="text-xl font-semibold text-slate-900">
              {children.length === 1 ? "Your Child" : "Your Children"}
            </h2>
          </div>
          {children.length > 3 && (
            <Link href="/parent/children" className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]">
              View all →
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {childData.map(({ child, gpa, percentage, attendanceRate, uniqueCourses }) => (
            <div
              key={child.student_id}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
            >
              {/* Child header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF2FF] text-lg font-bold text-[#4F46E5]">
                  {child.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{child.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {child.class && child.section
                      ? `${child.class} — ${child.section}`
                      : child.registration_number || ""}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <p className="text-xs text-slate-400">GPA</p>
                  <p className="mt-0.5 text-base font-bold text-slate-900">
                    {gpa > 0 ? gpa.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <p className="text-xs text-slate-400">Attend</p>
                  <p className={`mt-0.5 text-base font-bold ${attendanceRate !== null && attendanceRate < 80 ? "text-red-600" : "text-slate-900"}`}>
                    {attendanceRate !== null ? `${attendanceRate}%` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <p className="text-xs text-slate-400">Courses</p>
                  <p className="mt-0.5 text-base font-bold text-slate-900">{uniqueCourses}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/parent/child/${child.student_id}/marks`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Marks
                </Link>
                <Link
                  href={`/parent/child/${child.student_id}/attendance`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Announcements</p>
            <h2 className="text-xl font-semibold text-slate-900">Recent Announcements</h2>
          </div>
          <Link href="/parent/announcements" className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]">
            View all →
          </Link>
        </div>
        {announcements.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="Announcements from teachers will appear here."
          />
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <AnnouncementCard key={a.announcement_id} announcement={a} />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
