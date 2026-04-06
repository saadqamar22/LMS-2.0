"use client";

import Link from "next/link";
import type { ChildInfo } from "@/app/actions/parents";

interface ChildCardProps {
  child: ChildInfo;
}

export function ChildCard({ child }: ChildCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/parent/child/${child.student_id}/marks`}
        className="block"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          {child.full_name}
        </h3>
        {child.registration_number && (
          <p className="mt-1 text-sm text-slate-500">
            {child.registration_number}
          </p>
        )}
        {child.class && child.section && (
          <p className="mt-1 text-xs text-slate-400">
            {child.class} - {child.section}
          </p>
        )}
      </Link>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/parent/child/${child.student_id}/marks`}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Marks
        </Link>
        <Link
          href={`/parent/child/${child.student_id}/attendance`}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Attendance
        </Link>
      </div>
    </div>
  );
}

