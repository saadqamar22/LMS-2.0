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
        className="rounded-md px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--role-primary)" }}
      >
        Submit assignment
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
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
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <FileUploadCard onUpload={(filesList) => setFiles(filesList)} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-md px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--role-primary)" }}
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

