import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getStudentCourseAssignments } from "@/app/actions/assignments";
import { AssignmentCard } from "@/components/assignment-card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStudentSubmission } from "@/app/actions/submissions";

interface StudentAssignmentsPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function StudentAssignmentsPage({
  params,
}: StudentAssignmentsPageProps) {
  const { courseId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const assignmentsResult = await getStudentCourseAssignments(courseId);

  if (!assignmentsResult.success) {
    return (
      <DashboardShell role="student">
        <div className="mb-4">
          <Link
            href={`/student/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>
        </div>
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {assignmentsResult.error}
        </div>
      </DashboardShell>
    );
  }

  const assignments = assignmentsResult.assignments;

  // Fetch submission status for each assignment
  const assignmentsWithStatus = await Promise.all(
    assignments.map(async (assignment) => {
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
        submissionStatus,
        deadlineStatus,
        marks: submission?.marks || null,
      };
    }),
  );

  return (
    <DashboardShell role="student">
      <div className="mb-4">
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Link>
      </div>

      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Assignments
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Course Assignments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and submit your assignments
        </p>
      </section>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Your teacher hasn't created any assignments for this course yet."
        />
      ) : (
        <div className="space-y-4">
          {assignmentsWithStatus.map(({ assignment, submissionStatus, deadlineStatus, marks }) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              submissionStatus={submissionStatus}
              deadlineStatus={deadlineStatus}
              marks={marks}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

