"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveMark } from "@/app/actions/marks";
import type { EnrolledStudent } from "@/app/actions/enrollments";
import type { MarkEntry } from "@/app/actions/marks";
import { GraduationCap } from "lucide-react";

interface MarksFormProps {
  courseId: string;
  students: EnrolledStudent[];
  modules: Array<{ module_id: string; module_name: string; total_marks: number }>;
  selectedModuleId?: string;
  existingMarks: MarkEntry[];
}

export function MarksForm({
  courseId,
  students,
  modules,
  selectedModuleId: initialModuleId,
  existingMarks,
}: MarksFormProps) {
  const router = useRouter();
  const [selectedModuleId, setSelectedModuleId] = useState(
    initialModuleId || modules[0]?.module_id || "",
  );
  // Initialize marks data from existing marks
  const initialMarksData = useMemo(() => {
    const data: Record<
      string,
      {
        marksObtained: number | "";
        totalMarks: number | "";
        feedback: string;
      }
    > = {};

    students.forEach((student) => {
      const existing = existingMarks.find(
        (m) =>
          m.student_id === student.student_id &&
          m.module_id === selectedModuleId,
      );
      data[student.student_id] = {
        marksObtained:
          existing?.marks_obtained !== null && existing?.marks_obtained !== undefined
            ? existing.marks_obtained
            : "",
        totalMarks:
          existing?.total_marks !== null && existing?.total_marks !== undefined
            ? existing.total_marks
            : "",
        feedback: existing?.feedback || "",
      };
    });

    return data;
  }, [students, existingMarks, selectedModuleId]);

  const [marksData, setMarksData] = useState<
    Record<
      string,
      {
        marksObtained: number | "";
        totalMarks: number | "";
        feedback: string;
      }
    >
  >(initialMarksData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update marks data when module changes
  useEffect(() => {
    const newData: typeof initialMarksData = {};
    students.forEach((student) => {
      const existing = existingMarks.find(
        (m) =>
          m.student_id === student.student_id &&
          m.module_id === selectedModuleId,
      );
      newData[student.student_id] = {
        marksObtained:
          existing?.marks_obtained !== null && existing?.marks_obtained !== undefined
            ? existing.marks_obtained
            : "",
        totalMarks:
          existing?.total_marks !== null && existing?.total_marks !== undefined
            ? existing.total_marks
            : "",
        feedback: existing?.feedback || "",
      };
    });
    setMarksData(newData);
    setError(null);
    setSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  const selectedModule = modules.find((m) => m.module_id === selectedModuleId);

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setError(null);
    setSuccess(false);
    router.push(`/teacher/courses/${courseId}/marks?module=${moduleId}`);
  };

  const handleMarkChange = (
    studentId: string,
    field: "marksObtained" | "totalMarks" | "feedback",
    value: string | number,
  ) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!selectedModuleId) {
      setError("Please select a module.");
      setLoading(false);
      return;
    }

    const recordsToSave: Array<{
      studentId: string;
      marksObtained: number;
      totalMarks: number;
      feedback?: string;
    }> = [];

    for (const student of students) {
      const data = marksData[student.student_id];
      if (!data) continue;

      const marksObtained =
        typeof data.marksObtained === "number" ? data.marksObtained : 0;
      const totalMarks =
        typeof data.totalMarks === "number" ? data.totalMarks : 0;

      // Only save if at least total marks is provided
      if (totalMarks > 0) {
        recordsToSave.push({
          studentId: student.student_id,
          marksObtained,
          totalMarks,
          feedback: data.feedback || undefined,
        });
      }
    }

    if (recordsToSave.length === 0) {
      setError("Please enter marks for at least one student.");
      setLoading(false);
      return;
    }

    // Save marks one by one
    const errors: string[] = [];
    for (const record of recordsToSave) {
      const result = await saveMark({
        courseId,
        moduleId: selectedModuleId,
        studentId: record.studentId,
        marksObtained: record.marksObtained,
        totalMarks: record.totalMarks,
        feedback: record.feedback,
      });

      if (!result.success) {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      setError(errors[0]);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <label
              htmlFor="module"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select Module:
            </label>
            <select
              id="module"
              value={selectedModuleId}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            >
              {modules.map((module) => (
                <option key={module.module_id} value={module.module_id}>
                  {module.module_name} (Total: {module.total_marks} marks)
                </option>
              ))}
            </select>
            {selectedModule && (
              <p className="mt-2 text-xs text-slate-500">
                Enter marks for all enrolled students in this module
              </p>
            )}
          </div>

          <div className="space-y-4">
            {students.map((student) => {
              const data = marksData[student.student_id] || {
                marksObtained: "",
                totalMarks: "",
                feedback: "",
              };
              const percentage =
                typeof data.marksObtained === "number" &&
                typeof data.totalMarks === "number" &&
                data.totalMarks > 0
                  ? Math.round((data.marksObtained / data.totalMarks) * 100)
                  : null;

              return (
                <div
                  key={student.student_id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-[#EEF2FF] p-2 text-[#4F46E5]">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {student.full_name}
                      </p>
                      {student.registration_number && (
                        <p className="text-xs text-slate-500">
                          {student.registration_number}
                        </p>
                      )}
                    </div>
                    {percentage !== null && (
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">
                          {percentage}%
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Marks Obtained
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={data.marksObtained}
                        onChange={(e) =>
                          handleMarkChange(
                            student.student_id,
                            "marksObtained",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Total Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={data.totalMarks}
                        onChange={(e) =>
                          handleMarkChange(
                            student.student_id,
                            "totalMarks",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                        placeholder={selectedModule?.total_marks.toString() || "0"}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Feedback (optional)
                      </label>
                      <input
                        type="text"
                        value={data.feedback}
                        onChange={(e) =>
                          handleMarkChange(
                            student.student_id,
                            "feedback",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                        placeholder="Optional feedback"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">
            Marks saved successfully!
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#4F46E5] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Marks"}
          </button>
        </div>
      </form>
    </div>
  );
}
