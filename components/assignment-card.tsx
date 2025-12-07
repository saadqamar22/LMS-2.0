"use client";

import Link from "next/link";
import { Calendar, Clock, FileText, CheckCircle2, XCircle, Download } from "lucide-react";
import type { Assignment } from "@/app/actions/assignments";

interface AssignmentCardProps {
  assignment: Assignment;
  submissionStatus?: "submitted" | "graded" | "not_submitted";
  marks?: number | null;
  deadlineStatus?: "upcoming" | "due_soon" | "overdue";
}

export function AssignmentCard({
  assignment,
  submissionStatus,
  marks,
  deadlineStatus,
}: AssignmentCardProps) {
  const deadline = new Date(assignment.deadline);
  const now = new Date();
  const isOverdue = deadline < now;
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  const getDeadlineStatus = () => {
    if (isOverdue) return "overdue";
    if (daysUntilDeadline <= 3) return "due_soon";
    return "upcoming";
  };

  const status = deadlineStatus || getDeadlineStatus();

  const statusColors = {
    upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    due_soon: "bg-yellow-50 text-yellow-700 border-yellow-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
  };

  const submissionColors = {
    submitted: "text-green-600",
    graded: "text-blue-600",
    not_submitted: "text-slate-400",
  };

  return (
    <Link
      href={`/student/courses/${assignment.course_id}/assignments/${assignment.assignment_id}`}
      className="block rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-lg hover:border-[#4F46E5]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#4F46E5]" />
            <h3 className="text-lg font-semibold text-slate-900">
              {assignment.title}
            </h3>
          </div>

          {assignment.description && (
            <p className="mb-4 line-clamp-2 text-sm text-slate-600">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>
                Due: {deadline.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="h-4 w-4" />
              <span>
                {isOverdue
                  ? `${Math.abs(daysUntilDeadline)} days overdue`
                  : `${daysUntilDeadline} days left`}
              </span>
            </div>
            {assignment.file_url && (
              <div className="flex items-center gap-1.5 text-[#4F46E5]">
                <Download className="h-4 w-4" />
                <span className="font-medium">File Available</span>
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 flex flex-col items-end gap-2">
          <span
            className={`rounded-lg border px-3 py-1 text-xs font-semibold ${statusColors[status]}`}
          >
            {status === "overdue"
              ? "Overdue"
              : status === "due_soon"
                ? "Due Soon"
                : "Upcoming"}
          </span>

          {submissionStatus && (
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${submissionColors[submissionStatus]}`}
            >
              {submissionStatus === "graded" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Graded {marks !== null && marks !== undefined && `(${marks}%)`}
                  </span>
                </>
              ) : submissionStatus === "submitted" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submitted</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Not Submitted</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
