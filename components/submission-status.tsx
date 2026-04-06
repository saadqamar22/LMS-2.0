"use client";

import { CheckCircle2, Clock, Star, FileText, MessageSquare } from "lucide-react";
import type { Submission } from "@/app/actions/submissions";
import { normalizeFileUrl } from "@/lib/utils/file-url";

interface SubmissionStatusProps {
  submission: Submission | null;
}

export function SubmissionStatus({ submission }: SubmissionStatusProps) {
  if (!submission) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          <p className="text-sm font-semibold text-yellow-800">
            Not Submitted
          </p>
        </div>
          <p className="mt-1 text-xs text-yellow-700">
            You haven&apos;t submitted this assignment yet.
          </p>
      </div>
    );
  }

  const isGraded = submission.marks !== null && submission.marks !== undefined;
  const submittedAt = submission.submitted_at
    ? new Date(submission.submitted_at)
    : null;
  const gradedAt = submission.graded_at
    ? new Date(submission.graded_at)
    : null;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border p-4 ${
          isGraded
            ? "border-green-200 bg-green-50"
            : "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="flex items-center gap-2">
          {isGraded ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-blue-600" />
          )}
          <p
            className={`text-sm font-semibold ${
              isGraded ? "text-green-800" : "text-blue-800"
            }`}
          >
            {isGraded ? "Graded" : "Submitted"}
          </p>
        </div>
        {submittedAt && (
          <p className="mt-1 text-xs text-slate-600">
            Submitted on{" "}
            {submittedAt.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {isGraded && (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <p className="text-sm font-semibold text-slate-900">Marks</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-[#4F46E5]">
              {submission.marks}%
            </p>
            {gradedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Graded on{" "}
                {gradedAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {submission.feedback && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-600" />
                <p className="text-sm font-semibold text-slate-900">Feedback</p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {submission.feedback}
              </p>
            </div>
          )}
        </>
      )}

      {submission.file_url && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <p className="text-sm font-semibold text-slate-900">
              Submitted File
            </p>
          </div>
          <a
            href={normalizeFileUrl(submission.file_url, "submissions") || submission.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-[#4F46E5] hover:bg-slate-100"
          >
            <FileText className="h-4 w-4" />
            View File
          </a>
        </div>
      )}

      {submission.text_answer && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <p className="text-sm font-semibold text-slate-900">
              Your Answer
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {submission.text_answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

