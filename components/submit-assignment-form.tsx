"use client";

import { useState, useRef } from "react";
import { submitAssignment } from "@/app/actions/submissions";
import { Upload, FileText, XCircle } from "lucide-react";
import type { Submission } from "@/app/actions/submissions";
import { normalizeFileUrl } from "@/lib/utils/file-url";

interface SubmitAssignmentFormProps {
  assignmentId: string;
  courseId?: string;
  existingSubmission?: Submission | null;
  onSuccess?: () => void;
}

export function SubmitAssignmentForm({
  assignmentId,
  existingSubmission,
  onSuccess,
}: SubmitAssignmentFormProps) {
  const [textAnswer, setTextAnswer] = useState(
    existingSubmission?.text_answer || "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState(existingSubmission?.file_url || "");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Upload file first if one is selected
    let uploadedFileUrl: string | undefined = fileUrl || undefined;

    if (file) {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assignmentId", assignmentId);

        const uploadResponse = await fetch("/api/upload/submission", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          setError(uploadResult.error || "Failed to upload file.");
          setUploadingFile(false);
          setLoading(false);
          return;
        }

        uploadedFileUrl = uploadResult.fileUrl;
        setFileUrl(uploadedFileUrl);
      } catch {
        setError("Failed to upload file. Please try again.");
        setUploadingFile(false);
        setLoading(false);
        return;
      }
      setUploadingFile(false);
    }

    if (!textAnswer.trim() && !uploadedFileUrl) {
      setError("Please provide either a text answer or upload a file.");
      setLoading(false);
      return;
    }

    const result = await submitAssignment({
      assignmentId,
      textAnswer: textAnswer.trim() || undefined,
      fileUrl: uploadedFileUrl,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setLoading(false);

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5 text-[#4F46E5]" />
        <h3 className="text-lg font-semibold text-slate-900">
          {existingSubmission ? "Update Submission" : "Submit Assignment"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="textAnswer"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Text Answer
          </label>
          <textarea
            id="textAnswer"
            value={textAnswer}
            onChange={(e) => {
              setTextAnswer(e.target.value);
              setError(null);
            }}
            rows={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            placeholder="Type your answer here..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Upload File (Optional)
          </label>
          {file || (existingSubmission?.file_url && !file) ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">
                    {file ? file.name : "File uploaded"}
                  </span>
                  {file && (
                    <span className="text-xs text-slate-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              {existingSubmission?.file_url && !file && (
                <a
                  href={normalizeFileUrl(existingSubmission.file_url, "submissions") || existingSubmission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-[#4F46E5] hover:text-[#4338CA]"
                >
                  View current file →
                </a>
              )}
            </div>
          ) : (
            <div className="relative">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600 transition hover:border-[#4F46E5] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
              >
                <Upload className="h-5 w-5" />
                <span>Click to upload submission file</span>
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Supported formats: PDF, DOC, DOCX, TXT, ZIP, RAR, Images
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
            Assignment submitted successfully!
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || uploadingFile}
            className="flex-1 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingFile
              ? "Uploading file..."
              : loading
                ? existingSubmission
                  ? "Updating..."
                  : "Submitting..."
                : existingSubmission
                  ? "Update Submission"
                  : "Submit Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

