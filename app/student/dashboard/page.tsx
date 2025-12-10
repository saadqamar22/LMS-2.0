import { BookOpenCheck, Calendar, GraduationCap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { EmptyState } from "@/components/empty-state";
import { getStudentEnrollments } from "@/app/actions/enrollments";
import { getStudentMarks } from "@/app/actions/marks";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { calculateGPAFromMarks } from "@/lib/utils/gpa-calculator";
import { GPADisplay } from "@/components/gpa-display";
import Link from "next/link";
import { getStudentAttendance } from "@/app/actions/attendance";
import { getUpcomingAssignmentsForStudent } from "@/app/actions/assignments";
import { getStudentSubmission } from "@/app/actions/submissions";
import { AssignmentCard } from "@/components/assignment-card";
import { getStudentAnnouncements } from "@/app/actions/announcements";
import { AnnouncementCard } from "@/components/announcement-card";

export default async function StudentDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const [enrollmentsResult, marksResult, attendanceResult, assignmentsResult, announcementsResult] =
    await Promise.all([
      getStudentEnrollments(),
      getStudentMarks(),
      getStudentAttendance(),
      getUpcomingAssignmentsForStudent(5), // Get top 5 upcoming assignments
      getStudentAnnouncements(),
    ]);

  const enrolledCourses = enrollmentsResult.success ? enrollmentsResult.courses : [];
  const marks = marksResult.success ? marksResult.marks : [];
  const attendance = attendanceResult.success ? attendanceResult.attendance : [];
  const upcomingAssignments = assignmentsResult.success
    ? assignmentsResult.assignments
    : [];
  const announcements = announcementsResult.success
    ? announcementsResult.announcements.slice(0, 3) // Show latest 3 announcements
    : [];

  // Fetch submission status for each assignment
  const assignmentsWithStatus = await Promise.all(
    upcomingAssignments.map(async (assignment) => {
      const submissionResult = await getStudentSubmission(assignment.assignment_id);
      const submission = submissionResult.success ? submissionResult.submission : null;
      
      const deadline = new Date(assignment.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      
      let deadlineStatus: "upcoming" | "due_soon" | "overdue" = "upcoming";
      if (deadline < now) {
        deadlineStatus = "overdue";
      } else if (daysUntilDeadline <= 3) {
        deadlineStatus = "due_soon";
      }

      let submissionStatus: "submitted" | "graded" | "not_submitted" = "not_submitted";
      if (submission) {
        if (submission.marks !== null && submission.marks !== undefined) {
          submissionStatus = "graded";
        } else {
          submissionStatus = "submitted";
        }
      }

      return {
        assignment,
        submissionStatus,
        marks: submission?.marks ?? null,
        deadlineStatus,
      };
    }),
  );

  // Calculate GPA
  const { gpa, percentage } = calculateGPAFromMarks(marks);

  // Calculate attendance rate
  const totalAttendanceRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round(((presentCount + lateCount) / totalAttendanceRecords) * 100)
      : 0;

  return (
    <DashboardShell role="student">
      <section className="grid gap-6 md:grid-cols-3">
        <DashboardCard
          title="GPA"
          value={
            <GPADisplay gpa={gpa} percentage={percentage} size="lg" showToggle={true} />
          }
          subtitle="Click to switch between GPA and percentage"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <Link href="/student/attendance">
          <DashboardCard
            title="Attendance"
            value={
              <span className={attendanceRate < 80 ? "text-red-600" : ""}>
                {attendanceRate}%
              </span>
            }
            subtitle={`${presentCount + lateCount} / ${totalAttendanceRecords} present`}
            icon={<Calendar className="h-5 w-5" />}
          />
        </Link>
        <DashboardCard
          title="Enrolled Courses"
          value={enrolledCourses.length.toString()}
          subtitle="Total enrolled courses"
          icon={<BookOpenCheck className="h-5 w-5" />}
        />
      </section>

      <section>
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
            href="/student/announcements"
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
                  href="/student/announcements"
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
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Assignments
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Upcoming assignments
          </h2>
        </div>
        {assignmentsWithStatus.length === 0 ? (
          <EmptyState
            title="No upcoming assignments"
            description="You don't have any upcoming assignments at the moment."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignmentsWithStatus.map(({ assignment, submissionStatus, marks, deadlineStatus }) => (
              <AssignmentCard
                key={assignment.assignment_id}
                assignment={assignment}
                submissionStatus={submissionStatus}
                marks={marks}
                deadlineStatus={deadlineStatus}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
