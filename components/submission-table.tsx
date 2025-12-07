"use client";

import { useState } from "react";
import { gradeSubmission } from "@/app/actions/submissions";
import type { Submission } from "@/app/actions/submissions";
import { GraduationCap, FileText, Calendar, CheckCircle2, Clock } from "lucide-react";
import { GradeDialog } from "./grade-dialog";
import { normalizeFileUrl } from "@/lib/utils/file-url";

interface SubmissionTableProps {
  submissions: Submission[];
  onGradeUpdate?: () => void;
}

export function SubmissionTable({
  submissions,
  onGradeUpdate,
}: SubmissionTableProps) {
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const handleGrade = async (submissionId: string, marks: number, feedback?: string) => {
    setLoading(true);
    const result = await gradeSubmission({
      submissionId,
      marks,
      feedback,
    });

    if (result.success && onGradeUpdate) {
      onGradeUpdate();
    }

    setGradingSubmissionId(null);
    setLoading(false);
  };

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-sm font-medium text-slate-500">
          No submissions yet
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Students haven&apos;t submitted their assignments yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Submission
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Marks
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((submission) => {
                const isGraded = submission.marks !== null && submission.marks !== undefined;
                const submittedAt = submission.submitted_at
                  ? new Date(submission.submitted_at)
                  : null;

                return (
                  <tr key={submission.submission_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[#EEF2FF] p-2 text-[#4F46E5]">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {submission.student_name || "Unknown Student"}
                          </p>
                          {submission.registration_number && (
                            <p className="text-xs text-slate-500">
                              {submission.registration_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {submission.file_url && (
                          <a
                            href={normalizeFileUrl(submission.file_url, "submissions") || submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-[#4F46E5] hover:text-[#4338CA]"
                          >
                            <FileText className="h-4 w-4" />
                            View File
                          </a>
                        )}
                        {submission.text_answer && (
                          <p className="max-w-xs truncate text-sm text-slate-600">
                            {submission.text_answer}
                          </p>
                        )}
                        {!submission.file_url && !submission.text_answer && (
                          <span className="text-sm text-slate-400">No content</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {submittedAt ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {submittedAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Not submitted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isGraded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Graded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isGraded ? (
                        <span className="text-sm font-semibold text-slate-900">
                          {submission.marks}%
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setGradingSubmissionId(submission.submission_id)}
                        className="rounded-xl bg-[#4F46E5] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA]"
                      >
                        {isGraded ? "Update Grade" : "Grade"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {gradingSubmissionId && (
        <GradeDialog
          submission={submissions.find((s) => s.submission_id === gradingSubmissionId)!}
          onClose={() => setGradingSubmissionId(null)}
          onGrade={handleGrade}
          loading={loading}
        />
      )}
    </>
  );
}

