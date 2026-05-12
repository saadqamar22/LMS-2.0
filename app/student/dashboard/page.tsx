import { BookOpenCheck, Calendar, GraduationCap, ClipboardList, Clock, ArrowRight } from "lucide-react";
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
import { getStudentParentKey } from "@/app/actions/parents";
import { ParentKeyCard } from "./parent-key-card";
import { getPendingQuizzesForStudent } from "@/app/actions/quizzes";

export default async function StudentDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const [enrollmentsResult, marksResult, attendanceResult, assignmentsResult, announcementsResult, parentKeyResult, pendingQuizzesResult] =
    await Promise.all([
      getStudentEnrollments(),
      getStudentMarks(),
      getStudentAttendance(),
      getUpcomingAssignmentsForStudent(5),
      getStudentAnnouncements(),
      getStudentParentKey(),
      getPendingQuizzesForStudent(),
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

  const parentKey = parentKeyResult.success ? parentKeyResult.parentKey : null;
  const hasParent = parentKeyResult.success ? parentKeyResult.hasParent : false;
  const pendingQuizzes = pendingQuizzesResult.success ? pendingQuizzesResult.quizzes.slice(0, 5) : [];

  return (
    <DashboardShell role="student">
      {/* Parent Key Banner — shown until a parent links their account */}
      {!hasParent && parentKey && (
        <ParentKeyCard parentKey={parentKey} />
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <DashboardCard
          title="GPA"
          value={
            <GPADisplay gpa={gpa} percentage={percentage} size="lg" showToggle={true} />
          }
          subtitle="Click to toggle percentage"
          icon={<GraduationCap className="h-5 w-5" />}
          className="h-full"
        />
        <Link href="/student/attendance" className="block">
          <DashboardCard
            title="Attendance"
            value={
              <span className={attendanceRate < 80 ? "text-red-600" : ""}>
                {attendanceRate}%
              </span>
            }
            subtitle={`${presentCount + lateCount} / ${totalAttendanceRecords} present`}
            icon={<Calendar className="h-5 w-5" />}
            className="h-full"
          />
        </Link>
        <DashboardCard
          title="Enrolled Courses"
          value={enrolledCourses.length.toString()}
          subtitle="Active enrollments"
          icon={<BookOpenCheck className="h-5 w-5" />}
          className="h-full"
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Announcements</h2>
          <Link
            href="/student/announcements"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            View all →
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
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  View all {announcementsResult.announcements.length} announcements →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Due Quizzes */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">Due Quizzes</h2>
        </div>
        {pendingQuizzes.length === 0 ? (
          <EmptyState
            title="No pending quizzes"
            description="You have no unattempted quizzes right now. Check back after your teacher publishes one."
          />
        ) : (
          <div className="space-y-3">
            {pendingQuizzes.map((quiz) => (
              <div
                key={quiz.quiz_id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100" style={{ color: "var(--role-primary)" }}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{quiz.title}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                      <span>{quiz.course_code} — {quiz.course_name}</span>
                      {quiz.time_limit_mins && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.time_limit_mins} min
                        </span>
                      )}
                      <span>{quiz.total_marks} marks</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/student/courses/${quiz.course_id}/quizzes/${quiz.quiz_id}/take`}
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "var(--role-primary)" }}
                >
                  Start <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Upcoming Assignments
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
