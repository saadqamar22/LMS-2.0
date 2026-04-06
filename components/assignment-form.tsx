"use client";

import { useState, useRef } from "react";
import { createAssignment } from "@/app/actions/assignments";
import { Calendar, X, Upload, FileText, XCircle } from "lucide-react";

interface AssignmentFormProps {
  courseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AssignmentForm({
  courseId,
  onSuccess,
  onCancel,
}: AssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      setLoading(false);
      return;
    }

    if (!deadline) {
      setError("Deadline is required.");
      setLoading(false);
      return;
    }

    // Convert local datetime to ISO string
    const deadlineISO = new Date(deadline).toISOString();

    // Create assignment first (without file)
    const result = await createAssignment({
      courseId,
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadlineISO,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Upload file after assignment creation if one is selected
    if (file && result.success && result.assignment) {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assignmentId", result.assignment.assignment_id);

        const uploadResponse = await fetch("/api/upload/assignment", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          // Assignment was created but file upload failed
          setError(
            `Assignment created but file upload failed: ${uploadResult.error}`,
          );
          setUploadingFile(false);
          setLoading(false);
          // Still call onSuccess since assignment was created
          if (onSuccess) {
            onSuccess();
          }
          return;
        }

        // Update assignment with file URL
        const { updateAssignmentFileUrl } = await import(
          "@/app/actions/assignments"
        );
        const updateResult = await updateAssignmentFileUrl(
          result.assignment.assignment_id,
          uploadResult.fileUrl,
        );

        if (!updateResult.success) {
          // Assignment was created and file uploaded but URL update failed
          console.error("Failed to update assignment file URL:", updateResult.error);
          setError("Assignment created and file uploaded, but failed to save file link. Please refresh the page.");
        }
      } catch (err) {
        // Assignment was created but file upload failed
        console.error("File upload error:", err);
        setError("Assignment created but file upload failed. Please try uploading again.");
        setUploadingFile(false);
        setLoading(false);
        // Still call onSuccess since assignment was created
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      setUploadingFile(false);
    }

    // Reset form
    setTitle("");
    setDescription("");
    setDeadline("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
    setLoading(false);

    // Always call onSuccess to refresh the page and show the new assignment
    if (onSuccess) {
      onSuccess();
    }
  };

  // Get minimum datetime (now)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Create New Assignment
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Assignment Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            placeholder="e.g., Midterm Project"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            placeholder="Assignment instructions and requirements..."
          />
        </div>

        <div>
          <label
            htmlFor="deadline"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Deadline <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setError(null);
              }}
              min={minDateTime}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="file"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Assignment File (Optional)
          </label>
          {file ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
              />
              <label
                htmlFor="file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600 transition hover:border-[#4F46E5] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
              >
                <Upload className="h-5 w-5" />
                <span>Click to upload assignment file</span>
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Supported formats: PDF, DOC, DOCX, TXT, ZIP, RAR
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
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
                ? "Creating..."
                : "Create Assignment"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

