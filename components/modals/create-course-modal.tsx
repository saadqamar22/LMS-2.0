"use client";

import { useState } from "react";
import { FormInput } from "../form-input";

interface CreateCourseModalProps {
  onCreate?: (payload: { name: string; code: string; section: string }) => void;
}

export function CreateCourseModal({ onCreate }: CreateCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", section: "" });

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    onCreate?.(form);
    setOpen(false);
    setForm({ name: "", code: "", section: "" });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
      >
        Create course
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                New course
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <FormInput
                label="Course name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <FormInput
                label="Course code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <FormInput
                label="Section"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              />
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
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

