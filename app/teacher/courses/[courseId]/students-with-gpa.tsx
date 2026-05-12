"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { GPADisplay } from "@/components/gpa-display";
import type { EnrolledStudent } from "@/app/actions/enrollments";
import type { MarkEntry } from "@/app/actions/marks";
import { calculateGPAFromMarks } from "@/lib/utils/gpa-calculator";

interface StudentsWithGPAProps {
  students: EnrolledStudent[];
  studentMarks: Record<string, MarkEntry[]>;
}

export function StudentsWithGPA({
  students,
  studentMarks,
}: StudentsWithGPAProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registration Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Course GPA / Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const marks = studentMarks[student.student_id] || [];
              const { gpa, percentage } = calculateGPAFromMarks(marks);

              return (
                <tr
                  key={student.student_id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Users className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {student.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">
                      {student.registration_number || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {marks.length > 0 ? (
                      <GPADisplay
                        gpa={gpa}
                        percentage={percentage}
                        size="sm"
                        showToggle={true}
                      />
                    ) : (
                      <span className="text-sm text-slate-400">No marks yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/teacher/students/${student.student_id}`}
                      className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

