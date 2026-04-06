"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveMark } from "@/app/actions/marks";
import { createModule } from "@/app/actions/modules";
import type { EnrolledStudent } from "@/app/actions/enrollments";
import type { MarkEntry, ModuleStatistics } from "@/app/actions/marks";
import { GraduationCap, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatisticsWheel } from "@/components/charts/statistics-wheel";

interface MarksFormProps {
  courseId: string;
  students: EnrolledStudent[];
  modules: Array<{ module_id: string; module_name: string; total_marks: number }>;
  selectedModuleId?: string;
  existingMarks: MarkEntry[];
  statistics: ModuleStatistics | null;
}

export function MarksForm({
  courseId,
  students,
  modules,
  selectedModuleId: initialModuleId,
  existingMarks,
  statistics,
}: MarksFormProps) {
  const router = useRouter();
  const [selectedModuleId, setSelectedModuleId] = useState(
    initialModuleId || modules[0]?.module_id || "",
  );
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleTotalMarks, setNewModuleTotalMarks] = useState<number | "">("");
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // Initialize marks data from existing marks
  const initialMarksData = useMemo(() => {
    const data: Record<string, { obtainedMarks: number | "" }> = {};

    students.forEach((student) => {
      const existing = existingMarks.find(
        (m) =>
          m.student_id === student.student_id &&
          m.module_id === selectedModuleId,
      );
      data[student.student_id] = {
        obtainedMarks:
          existing?.obtained_marks !== null &&
          existing?.obtained_marks !== undefined
            ? existing.obtained_marks
            : "",
      };
    });

    return data;
  }, [students, existingMarks, selectedModuleId]);

  const [marksData, setMarksData] = useState<
    Record<string, { obtainedMarks: number | "" }>
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
        obtainedMarks:
          existing?.obtained_marks !== null &&
          existing?.obtained_marks !== undefined
            ? existing.obtained_marks
            : "",
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

  const handleMarkChange = (studentId: string, value: string | number) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        obtainedMarks: value === "" ? "" : typeof value === "number" ? value : parseFloat(value as string) || 0,
      },
    }));
    setError(null);
    setSuccess(false);
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      setModuleError("Module name is required.");
      return;
    }

    if (!newModuleTotalMarks || newModuleTotalMarks <= 0) {
      setModuleError("Total marks must be greater than 0.");
      return;
    }

    setCreatingModule(true);
    setModuleError(null);

    const result = await createModule(
      courseId,
      newModuleName.trim(),
      typeof newModuleTotalMarks === "number" ? newModuleTotalMarks : 0,
    );

    if (!result.success) {
      setModuleError(result.error);
      setCreatingModule(false);
      return;
    }

    setShowCreateModule(false);
    setNewModuleName("");
    setNewModuleTotalMarks("");
    setCreatingModule(false);
    router.refresh();
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
      obtainedMarks: number;
    }> = [];

    for (const student of students) {
      const data = marksData[student.student_id];
      if (!data) continue;

      const obtainedMarks =
        typeof data.obtainedMarks === "number" ? data.obtainedMarks : 0;

      // Only save if marks are provided
      if (obtainedMarks >= 0) {
        recordsToSave.push({
          studentId: student.student_id,
          obtainedMarks,
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
        moduleId: selectedModuleId,
        studentId: record.studentId,
        obtainedMarks: record.obtainedMarks,
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

  // Calculate remarks for each student
  const getRemarks = (obtainedMarks: number): { text: string; icon: React.ReactNode; color: string } => {
    if (!statistics || statistics.average === 0) {
      return { text: "No data available", icon: <Minus className="h-4 w-4" />, color: "text-slate-500" };
    }

    const diff = obtainedMarks - statistics.average;
    const stdDev = statistics.stdDeviation;

    if (diff > stdDev) {
      return {
        text: "Excellent! Well above average",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-600",
      };
    } else if (diff > 0) {
      return {
        text: "Good! Above average",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-500",
      };
    } else if (diff > -stdDev) {
      return {
        text: "Average performance",
        icon: <Minus className="h-4 w-4" />,
        color: "text-yellow-600",
      };
    } else {
      return {
        text: "Below average - needs improvement",
        icon: <TrendingDown className="h-4 w-4" />,
        color: "text-red-600",
      };
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Module Selection and Creation */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <label
            htmlFor="module"
            className="block text-sm font-medium text-slate-700"
          >
            Select Module:
          </label>
          <button
            type="button"
            onClick={() => setShowCreateModule(!showCreateModule)}
            className="flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            <Plus className="h-4 w-4" />
            Create Module
          </button>
        </div>

        {showCreateModule && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Module Name
                </label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => {
                    setNewModuleName(e.target.value);
                    setModuleError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                  placeholder="e.g., Midterm Exam"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Total Marks
                </label>
                <input
                  type="number"
                  min="1"
                  value={newModuleTotalMarks}
                  onChange={(e) => {
                    setNewModuleTotalMarks(
                      e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
                    );
                    setModuleError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
                  placeholder="100"
                />
              </div>
            </div>
            {moduleError && (
              <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">
                {moduleError}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCreateModule}
                disabled={creatingModule}
                className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
              >
                {creatingModule ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModule(false);
                  setNewModuleName("");
                  setNewModuleTotalMarks("");
                  setModuleError(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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

      {/* Statistics Wheel */}
      {statistics && selectedModule && (
        <StatisticsWheel
          average={statistics.average}
          stdDeviation={statistics.stdDeviation}
          totalMarks={statistics.totalMarks}
          moduleName={statistics.module_name}
        />
      )}

      {/* Marks Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Enter Marks for Students
          </h3>

          {/* Statistics Table Header */}
          {statistics && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-5 gap-4 text-center text-xs font-medium text-slate-600">
                <div>
                  <p>Average</p>
                  <p className="text-sm font-semibold text-[#4F46E5]">
                    {statistics.average.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p>Std Dev</p>
                  <p className="text-sm font-semibold text-[#F59E0B]">
                    {statistics.stdDeviation.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p>Min</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {statistics.minMarks}
                  </p>
                </div>
                <div>
                  <p>Max</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {statistics.maxMarks}
                  </p>
                </div>
                <div>
                  <p>Median</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {statistics.medianMarks.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {students.map((student) => {
              const data = marksData[student.student_id] || {
                obtainedMarks: "",
              };
              const obtainedMarks =
                typeof data.obtainedMarks === "number" ? data.obtainedMarks : 0;
              const percentage =
                selectedModule && selectedModule.total_marks > 0
                  ? Math.round((obtainedMarks / selectedModule.total_marks) * 100)
                  : null;
              const remarks = getRemarks(obtainedMarks);
              const diffFromAverage =
                statistics && statistics.average > 0
                  ? obtainedMarks - statistics.average
                  : null;

              return (
                <div
                  key={student.student_id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#EEF2FF] p-2 text-[#4F46E5]">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {student.full_name}
                        </p>
                        {student.registration_number && (
                          <p className="text-xs text-slate-500">
                            {student.registration_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {percentage !== null && (
                        <p className="text-lg font-semibold text-slate-900">
                          {percentage}%
                        </p>
                      )}
                      {diffFromAverage !== null && (
                        <p
                          className={`text-xs font-medium ${
                            diffFromAverage >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {diffFromAverage >= 0 ? "+" : ""}
                          {diffFromAverage.toFixed(2)} from avg
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Marks Obtained (out of {selectedModule?.total_marks || 0})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedModule?.total_marks || 1000}
                        value={data.obtainedMarks}
                        onChange={(e) =>
                          handleMarkChange(
                            student.student_id,
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
                        Remarks
                      </label>
                      <div
                        className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 ${remarks.color}`}
                      >
                        {remarks.icon}
                        <p className="text-sm font-medium">{remarks.text}</p>
                      </div>
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
