import { CloudUpload } from "lucide-react";
import { ChangeEvent } from "react";

interface FileUploadCardProps {
  title?: string;
  description?: string;
  onUpload?: (files: FileList) => void;
}

export function FileUploadCard({
  title = "Upload files",
  description = "Drag & drop files or click to browse",
  onUpload,
}: FileUploadCardProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && onUpload) {
      onUpload(event.target.files);
    }
  };

  return (
    <label className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 transition hover:border-slate-400 hover:bg-slate-50">
      <input type="file" className="hidden" multiple onChange={handleChange} />
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100" style={{ color: "var(--role-primary)" }}>
        <CloudUpload className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}

