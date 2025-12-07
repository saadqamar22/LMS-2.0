import { DashboardShell } from "@/components/dashboard-shell";
import { getAssignmentById } from "@/app/actions/assignments";
import { getStudentSubmission } from "@/app/actions/submissions";
import { SubmissionStatus } from "@/components/submission-status";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Link from "next/link";
import { ArrowLeft, Calendar, AlertCircle, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { SubmitFormClient } from "./submit-form-client";

interface StudentAssignmentDetailPageProps {
  params: Promise<{ courseId: string; assignmentId: string }>;
}

export default async function StudentAssignmentDetailPage({
  params,
}: StudentAssignmentDetailPageProps) {
  const { courseId, assignmentId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const [assignmentResult, submissionResult] = await Promise.all([
    getAssignmentById(assignmentId),
    getStudentSubmission(assignmentId),
  ]);

  if (!assignmentResult.success) {
    notFound();
  }

  const assignment = assignmentResult.assignment;
  const submission = submissionResult.success ? submissionResult.submission : null;

  const deadline = new Date(assignment.deadline);
  const now = new Date();
  const isOverdue = deadline < now;
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <DashboardShell role="student">
      <div className="mb-4">
        <Link
          href={`/student/courses/${courseId}/assignments`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Link>
      </div>

      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Assignment
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit your assignment before the deadline
        </p>
      </section>

      {/* Assignment Info */}
      <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-4">
          {assignment.description && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {assignment.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">Deadline</p>
                <p className="text-sm font-semibold text-slate-900">
                  {deadline.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {assignment.file_url && (
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Assignment File
                  </p>
                  <a
                    href={assignment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline"
                  >
                    Download Assignment File →
                  </a>
                </div>
              </div>
            )}
          </div>

          {isOverdue && !submission && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>This assignment deadline has passed. Late submissions may not be accepted.</p>
            </div>
          )}

          {!isOverdue && daysUntilDeadline <= 3 && (
            <div className="flex items-start gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>This assignment is due soon. Make sure to submit on time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submission Status */}
      {submission && (
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Your Submission
          </h2>
          <SubmissionStatus submission={submission} />
        </div>
      )}

      {/* Submit/Update Form */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {submission ? "Update Submission" : "Submit Assignment"}
        </h2>
        <SubmitFormClient
          assignmentId={assignmentId}
          courseId={courseId}
          existingSubmission={submission}
        />
      </div>
    </DashboardShell>
  );
}

