import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getStudentEnrollments } from "@/app/actions/enrollments";
import { getStudentCourseAssignments } from "@/app/actions/assignments";
import { getStudentSubmission } from "@/app/actions/submissions";
import { AssignmentCard } from "@/components/assignment-card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { FileText } from "lucide-react";

export default async function StudentAssignmentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  // Get all enrolled courses
  const enrollmentsResult = await getStudentEnrollments();

  if (!enrollmentsResult.success) {
    return (
      <DashboardShell role="student">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {enrollmentsResult.error}
        </div>
      </DashboardShell>
    );
  }

  const { enrollments, courses } = enrollmentsResult;

  // Create a map of course_id to course info
  const courseMap = new Map(
    courses.map((course) => [course.course_id, course]),
  );

  // Get assignments from all enrolled courses
  const allAssignments = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = courseMap.get(enrollment.course_id);
      const assignmentsResult = await getStudentCourseAssignments(
        enrollment.course_id,
      );
      if (assignmentsResult.success && course) {
        return assignmentsResult.assignments.map((assignment) => ({
          assignment,
          courseName: course.course_name,
          courseCode: course.course_code,
        }));
      }
      return [];
    }),
  );

  const flattenedAssignments = allAssignments.flat();

  // Fetch submission status for each assignment
  const assignmentsWithStatus = await Promise.all(
    flattenedAssignments.map(async ({ assignment, courseName, courseCode }) => {
      const submissionResult = await getStudentSubmission(assignment.assignment_id);
      const submission = submissionResult.success ? submissionResult.submission : null;

      const deadline = new Date(assignment.deadline);
      const now = new Date();
      const isOverdue = deadline < now;
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let deadlineStatus: "upcoming" | "due_soon" | "overdue" = "upcoming";
      if (isOverdue) {
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
        courseName,
        courseCode,
        submissionStatus,
        deadlineStatus,
        marks: submission?.marks || null,
      };
    }),
  );

  // Sort by deadline (due soon first, then overdue, then upcoming)
  assignmentsWithStatus.sort((a, b) => {
    const deadlineA = new Date(a.assignment.deadline).getTime();
    const deadlineB = new Date(b.assignment.deadline).getTime();
    return deadlineA - deadlineB;
  });

  return (
    <DashboardShell role="student">
      <section className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#EEF2FF] p-2 text-[#4F46E5]">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              All Assignments
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              My Assignments
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and submit assignments from all your enrolled courses
            </p>
          </div>
        </div>
      </section>

      {assignmentsWithStatus.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="You don't have any assignments from your enrolled courses yet."
        />
      ) : (
        <div className="space-y-4">
          {assignmentsWithStatus.map(
            ({ assignment, courseName, courseCode, submissionStatus, deadlineStatus, marks }) => (
              <div key={assignment.assignment_id} className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    {courseCode} - {courseName}
                  </span>
                </div>
                <AssignmentCard
                  assignment={assignment}
                  submissionStatus={submissionStatus}
                  deadlineStatus={deadlineStatus}
                  marks={marks}
                />
              </div>
            ),
          )}
        </div>
      )}
    </DashboardShell>
  );
}
