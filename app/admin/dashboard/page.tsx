import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";

async function getAdminStats() {
  const supabase = createAdminClient();

  const [
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalParents },
    { count: totalCourses },
    { count: totalEnrollments },
    { data: recentUsers },
    { data: attendanceData },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "parent"),
    supabase.from("courses").select("course_id", { count: "exact", head: true }),
    supabase.from("enrollments").select("enrollment_id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("attendance")
      .select("status")
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
  ]);

  const attendance = (attendanceData || []) as { status: string }[];
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

  return {
    totalStudents: totalStudents ?? 0,
    totalTeachers: totalTeachers ?? 0,
    totalParents: totalParents ?? 0,
    totalCourses: totalCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
    recentUsers: (recentUsers || []) as {
      id: string;
      full_name: string | null;
      email: string;
      role: string;
      created_at: string | null;
    }[],
    attendancePct,
    totalAttendanceRecords: totalAttendance,
  };
}

const ROLE_BADGE: Record<string, string> = {
  student: "bg-blue-50 text-blue-700",
  teacher: "bg-purple-50 text-purple-700",
  parent: "bg-green-50 text-green-700",
  admin: "bg-indigo-50 text-indigo-700",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <DashboardShell role="admin">
      {/* Stat cards */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle={`${stats.totalEnrollments} course enrollments`}
          icon={<GraduationCap className="h-6 w-6" />}
        />
        <DashboardCard
          title="Teachers"
          value={stats.totalTeachers}
          subtitle={`${stats.totalCourses} active course${stats.totalCourses !== 1 ? "s" : ""}`}
          icon={<UserCheck className="h-6 w-6" />}
        />
        <DashboardCard
          title="Active Courses"
          value={stats.totalCourses}
          subtitle={`Avg ${stats.totalTeachers > 0 ? (stats.totalCourses / stats.totalTeachers).toFixed(1) : 0} per teacher`}
          icon={<BookOpen className="h-6 w-6" />}
        />
        <DashboardCard
          title="Total Users"
          value={stats.totalStudents + stats.totalTeachers + stats.totalParents}
          subtitle={`${stats.totalParents} parent account${stats.totalParents !== 1 ? "s" : ""}`}
          icon={<Users className="h-6 w-6" />}
        />
      </section>

      {/* Attendance overview + enrollment breakdown */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-slate-400">Last 30 days</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Attendance Overview</h2>
          {stats.attendancePct === null ? (
            <p className="mt-4 text-sm text-slate-400">No attendance records in the last 30 days.</p>
          ) : (
            <>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-5xl font-bold text-slate-900">{stats.attendancePct}%</span>
                <span className="mb-1 text-sm text-slate-400">overall present rate</span>
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-green-500 transition-all"
                  style={{ width: `${stats.attendancePct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">{stats.totalAttendanceRecords} records across all courses</p>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-slate-400">Breakdown</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">User Roles</h2>
          <div className="mt-6 space-y-4">
            {[
              { label: "Students", count: stats.totalStudents, color: "bg-blue-500", total: stats.totalStudents + stats.totalTeachers + stats.totalParents },
              { label: "Teachers", count: stats.totalTeachers, color: "bg-purple-500", total: stats.totalStudents + stats.totalTeachers + stats.totalParents },
              { label: "Parents", count: stats.totalParents, color: "bg-green-500", total: stats.totalStudents + stats.totalTeachers + stats.totalParents },
            ].map(({ label, count, color, total }) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="text-slate-500">{count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent users */}
      <section className="rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Users</p>
            <h2 className="text-xl font-semibold text-slate-900">Recent Registrations</h2>
          </div>
        </div>

        {stats.recentUsers.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No users registered yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-500">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-500">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-500">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {user.full_name || "—"}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[user.role] || ROLE_BADGE.admin}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </DashboardShell>
  );
}
