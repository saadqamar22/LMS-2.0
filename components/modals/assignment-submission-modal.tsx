"use client";

import { useState } from "react";
import { FileUploadCard } from "../file-upload-card";

interface AssignmentSubmissionModalProps {
  assignmentTitle: string;
  onSubmit?: (payload: { comment: string; files: FileList | null }) => void;
}

export function AssignmentSubmissionModal({
  assignmentTitle,
  onSubmit,
}: AssignmentSubmissionModalProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = () => {
    onSubmit?.({ comment, files });
    setOpen(false);
    setComment("");
    setFiles(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white"
      >
        Submit assignment
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Submit {assignmentTitle}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add comments or links..."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
              />
              <FileUploadCard onUpload={(filesList) => setFiles(filesList)} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

