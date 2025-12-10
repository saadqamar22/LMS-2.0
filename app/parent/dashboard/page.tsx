import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { EmptyState } from "@/components/empty-state";
import { getParentChildren } from "@/app/actions/parents";
import { getChildMarks } from "@/app/actions/marks";
import Link from "next/link";
import { BookOpenCheck, Calendar } from "lucide-react";
import { ChildCard } from "./child-card";
import { getParentAnnouncements } from "@/app/actions/announcements";
import { AnnouncementCard } from "@/components/announcement-card";

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

  // Aggregate data across all children
  // Fetch marks for all children to calculate overall GPA
  let allMarks: any[] = [];
  let totalCourses = 0;

  // Fetch marks for each child
  const marksPromises = childrenResult.children.map((child) =>
    getChildMarks(child.student_id)
  );
  const marksResults = await Promise.all(marksPromises);

  // Aggregate marks
  for (const result of marksResults) {
    if (result.success) {
      allMarks = [...allMarks, ...result.marks];
    }
  }

  // Get unique courses count from marks
  const uniqueCourseIds = new Set(
    allMarks.map((m) => m.course_id || m.course_code).filter(Boolean)
  );
  totalCourses = uniqueCourseIds.size;

  // For attendance, we'll show a link to children page since individual child pages have detailed attendance
  // In a production app, you'd aggregate attendance here too
  const totalAttendanceRecords = 0;
  const totalPresentCount = 0;
  const totalLateCount = 0;

  // Calculate attendance rate
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round(((totalPresentCount + totalLateCount) / totalAttendanceRecords) * 100)
      : 0;

  // Get announcements
  const announcements = announcementsResult.success
    ? announcementsResult.announcements.slice(0, 3) // Show latest 3 announcements
    : [];

  return (
    <DashboardShell role="parent">
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Overview for {childrenResult.children.length} {childrenResult.children.length === 1 ? "Child" : "Children"}
        </h2>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/parent/children">
          <DashboardCard
            title="Attendance"
            value={
              totalAttendanceRecords > 0 ? (
                <span className={attendanceRate < 80 ? "text-red-600" : ""}>
                  {attendanceRate}%
                </span>
              ) : (
                "N/A"
              )
            }
            subtitle={
              totalAttendanceRecords > 0
                ? `${totalPresentCount + totalLateCount} / ${totalAttendanceRecords} present`
                : "View individual child pages for details"
            }
            icon={<Calendar className="h-5 w-5" />}
          />
        </Link>
        <Link href="/parent/children">
          <DashboardCard
            title="Enrolled Courses"
            value={totalCourses.toString()}
            subtitle="Total enrolled courses"
            icon={<BookOpenCheck className="h-5 w-5" />}
          />
        </Link>
        <Link href="/parent/children">
          <DashboardCard
            title="Children"
            value={childrenResult.children.length.toString()}
            subtitle="View all children"
            icon={<BookOpenCheck className="h-5 w-5" />}
          />
        </Link>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Announcements
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Recent Announcements
            </h2>
          </div>
          <Link
            href="/parent/announcements"
            className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            View All →
          </Link>
        </div>
        {announcements.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="You don't have any announcements at the moment. Check back later for updates."
          />
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.announcement_id}
                announcement={announcement}
              />
            ))}
            {announcementsResult.success && announcementsResult.announcements.length > 3 && (
              <div className="text-center">
                <Link
                  href="/parent/announcements"
                  className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
                >
                  View all {announcementsResult.announcements.length} announcements →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Children
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Your Children
            </h2>
          </div>
          <Link
            href="/parent/children"
            className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            View All →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {childrenResult.children.slice(0, 3).map((child) => (
            <ChildCard key={child.student_id} child={child} />
          ))}
        </div>
        {childrenResult.children.length > 3 && (
          <div className="mt-4 text-center">
            <Link
              href="/parent/children"
              className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
            >
              View all {childrenResult.children.length} children →
            </Link>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

