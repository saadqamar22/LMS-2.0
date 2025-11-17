import { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export function FormInput({
  label,
  description,
  className,
  error,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        {...props}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#A5B4FC] disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

