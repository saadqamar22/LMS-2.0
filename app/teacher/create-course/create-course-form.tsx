"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Instructor
          </p>
          <p className="text-lg font-semibold text-slate-900">{teacherName}</p>
        </div>

        <Field label="Course name" required>
          <input
            name="course_name"
            required
            placeholder="e.g., Advanced AI Systems"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </Field>

        <Field label="Course code" required>
          <input
            name="course_code"
            required
            placeholder="e.g., CS401"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
        "rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-violet-700",
        pending && "cursor-not-allowed opacity-70",
      )}
    >
      {pending ? "Creating..." : "Create course"}
    </button>
  );
}

