"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import type { Submission } from "@/app/actions/submissions";
import { normalizeFileUrl } from "@/lib/utils/file-url";

interface GradeDialogProps {
  submission: Submission;
  onClose: () => void;
  onGrade: (submissionId: string, marks: number, feedback?: string) => Promise<void>;
  loading?: boolean;
}

export function GradeDialog({
  submission,
  onClose,
  onGrade,
  loading = false,
}: GradeDialogProps) {
  const [marks, setMarks] = useState<number | "">(
    submission.marks !== null && submission.marks !== undefined
      ? submission.marks
      : "",
  );
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (marks === "" || typeof marks !== "number") {
      setError("Please enter marks.");
      return;
    }

    if (marks < 0 || marks > 100) {
      setError("Marks must be between 0 and 100.");
      return;
    }

    await onGrade(submission.submission_id, marks, feedback.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Grade Submission
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-600">Student</p>
            <p className="text-base font-semibold text-slate-900">
              {submission.student_name || "Unknown Student"}
            </p>
            {submission.registration_number && (
              <p className="mt-1 text-sm text-slate-500">
                {submission.registration_number}
              </p>
            )}
          </div>

          {submission.text_answer && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-slate-600">
                Text Answer
              </p>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {submission.text_answer}
                </p>
              </div>
            </div>
          )}

          {submission.file_url && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-slate-600">File</p>
              <a
                href={normalizeFileUrl(submission.file_url, "submissions") || submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-[#4F46E5] hover:bg-slate-50"
              >
                View Submitted File
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="marks"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Marks (0-100) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-yellow-400" />
                <input
                  id="marks"
                  type="number"
                  min="0"
                  max="100"
                  value={marks}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                    setMarks(value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                  placeholder="Enter marks (0-100)"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="feedback"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Feedback
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  setError(null);
                }}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                placeholder="Provide feedback to the student..."
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Grading..." : "Submit Grade"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

