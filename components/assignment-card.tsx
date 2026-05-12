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

  const statusStyles = {
    upcoming: "bg-blue-50 text-blue-700 border-blue-100",
    due_soon: "bg-amber-50 text-amber-700 border-amber-100",
    overdue: "bg-red-50 text-red-700 border-red-100",
  };

  const submissionColors = {
    submitted: "text-emerald-600",
    graded: "text-blue-600",
    not_submitted: "text-slate-400",
  };

  return (
    <Link
      href={`/student/courses/${assignment.course_id}/assignments/${assignment.assignment_id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
          </div>

          {assignment.description && (
            <p className="mb-3 line-clamp-2 text-sm text-slate-500">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Due {deadline.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {isOverdue
                ? `${Math.abs(daysUntilDeadline)}d overdue`
                : `${daysUntilDeadline}d left`}
            </span>
            {assignment.file_url && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Download className="h-3.5 w-3.5" />
                File attached
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
            {status === "overdue" ? "Overdue" : status === "due_soon" ? "Due Soon" : "Upcoming"}
          </span>

          {submissionStatus && (
            <div className={`flex items-center gap-1 text-xs font-medium ${submissionColors[submissionStatus]}`}>
              {submissionStatus === "graded" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Graded {marks != null && `(${marks}%)`}</span>
                </>
              ) : submissionStatus === "submitted" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Submitted</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Not submitted</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
