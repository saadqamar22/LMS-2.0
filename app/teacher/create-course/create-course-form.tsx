"use client";

import type { ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import clsx from "clsx";
import type { CreateCourseActionState } from "./types";

interface CreateCourseFormProps {
  teacherName: string;
  action: (
    prevState: CreateCourseActionState,
    formData: FormData,
  ) => Promise<CreateCourseActionState>;
}

const initialState: CreateCourseActionState = {};

export function CreateCourseForm({
  teacherName,
  action,
}: CreateCourseFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Instructor
          </p>
          <p className="text-lg font-semibold text-slate-900">{teacherName}</p>
        </div>

        <Field label="Course name" required>
          <input
            name="course_name"
            required
            placeholder="e.g., Advanced AI Systems"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
          />
        </Field>

        <Field label="Course code" required>
          <input
            name="course_code"
            required
            placeholder="e.g., CS401"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
          />
          <p className="mt-1 text-xs text-slate-500">
            Unique course code (e.g., CS401, MATH202)
          </p>
        </Field>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "rounded-2xl bg-[#4F46E5] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#4338CA]",
        pending && "cursor-not-allowed opacity-70",
      )}
    >
      {pending ? "Creating..." : "Create course"}
    </button>
  );
}

