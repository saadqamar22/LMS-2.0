import { DashboardShell } from "@/components/dashboard-shell";
import { getAssignmentById } from "@/app/actions/assignments";
import { getAssignmentSubmissions } from "@/app/actions/submissions";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { SubmissionsClient } from "./submissions-client";

interface TeacherAssignmentDetailPageProps {
  params: Promise<{ courseId: string; assignmentId: string }>;
}

export default async function TeacherAssignmentDetailPage({
  params,
}: TeacherAssignmentDetailPageProps) {
  const { courseId, assignmentId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const [assignmentResult, submissionsResult] = await Promise.all([
    getAssignmentById(assignmentId),
    getAssignmentSubmissions(assignmentId),
  ]);

  if (!assignmentResult.success) {
    notFound();
  }

  const assignment = assignmentResult.assignment;
  const submissions = submissionsResult.success
    ? submissionsResult.submissions
    : [];

  const deadline = new Date(assignment.deadline);
  const now = new Date();
  const isOverdue = deadline < now;

  return (
    <DashboardShell role="teacher">
      <div className="mb-4">
        <Link
          href={`/teacher/courses/${courseId}/assignments`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Link>
      </div>

      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Assignment Details
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and grade student submissions
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
              <p className="text-sm text-slate-700">{assignment.description}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
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

            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Submissions
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {submissions.length} student{submissions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {assignment.file_url && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Download className="h-5 w-5 text-slate-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500">
                  Assignment File
                </p>
                <a
                  href={assignment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline"
                >
                  View/Download Assignment File →
                </a>
              </div>
            </div>
          )}

          {isOverdue && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
              This assignment deadline has passed.
            </div>
          )}
        </div>
      </div>

      {/* Submissions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Student Submissions
        </h2>
        <SubmissionsClient submissions={submissions} />
      </section>
    </DashboardShell>
  );
}

