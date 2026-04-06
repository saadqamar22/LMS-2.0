"use client";

import Link from "next/link";
import { FileText, Calendar, Download } from "lucide-react";
import type { Assignment } from "@/app/actions/assignments";

interface AssignmentListProps {
  assignments: Assignment[];
  courseId: string;
}

export function AssignmentList({ assignments, courseId }: AssignmentListProps) {
  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const deadline = new Date(assignment.deadline);
        const now = new Date();
        const isOverdue = deadline < now;
        const daysUntilDeadline = Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        return (
          <Link
            key={assignment.assignment_id}
            href={`/teacher/courses/${courseId}/assignments/${assignment.assignment_id}`}
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
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {assignment.file_url && (
                    <div className="flex items-center gap-1.5 text-[#4F46E5]">
                      <Download className="h-4 w-4" />
                      <span className="font-medium">File Attached</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <span
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                    isOverdue
                      ? "bg-red-50 text-red-700 border-red-200"
                      : daysUntilDeadline <= 3
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {isOverdue
                    ? "Overdue"
                    : daysUntilDeadline <= 3
                      ? "Due Soon"
                      : "Active"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

