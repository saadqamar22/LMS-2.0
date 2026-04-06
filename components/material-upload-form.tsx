"use client";

import { useState } from "react";
import { addMaterial } from "@/app/actions/materials";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";

interface MaterialUploadFormProps {
  courseId: string;
  onSuccess?: () => void;
}

type MaterialType = "pdf" | "video" | "link" | "image" | "other";

export function MaterialUploadForm({ courseId, onSuccess }: MaterialUploadFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<MaterialType>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isLink = type === "link";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUploading(true);

    try {
      let fileUrl: string | undefined;

      if (!isLink) {
        if (!file) {
          setError("Please select a file.");
          setUploading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("courseId", courseId);

        const res = await fetch("/api/upload/material", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "File upload failed.");
          setUploading(false);
          return;
        }
        fileUrl = data.fileUrl;
      }

      const result = await addMaterial({
        courseId,
        title,
        description,
        type,
        fileUrl,
        externalUrl: isLink ? externalUrl : undefined,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setTitle("");
        setDescription("");
        setFile(null);
        setExternalUrl("");
        setType("pdf");
        onSuccess?.();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Chapter 1 Notes"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MaterialType)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        >
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
          <option value="link">External Link</option>
          <option value="other">Other</option>
        </select>
      </div>

      {isLink ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">URL *</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5">
            <LinkIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              required
              placeholder="https://..."
              className="flex-1 text-sm outline-none"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">File *</label>
          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
              <span className="truncate text-sm text-slate-700">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-4 hover:border-slate-400">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-500">Click to select a file (max 50MB)</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          "Add Material"
        )}
      </button>
    </form>
  );
}
