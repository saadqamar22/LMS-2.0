"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createModule } from "@/app/actions/modules";
import { saveMark } from "@/app/actions/marks";
import type { EnrolledStudent } from "@/app/actions/enrollments";
import type { MarkEntry, ModuleStatistics } from "@/app/actions/marks";
import { GraduationCap, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatisticsWheel } from "@/components/charts/statistics-wheel";

interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
}

interface MarksEntryFormProps {
  courses: Course[];
  selectedCourseId?: string;
}

export function MarksEntryForm({
  courses,
  selectedCourseId: initialCourseId,
}: MarksEntryFormProps) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialCourseId || courses[0]?.course_id || "",
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [modules, setModules] = useState<
    Array<{ module_id: string; module_name: string; total_marks: number }>
  >([]);
  const [statistics, setStatistics] = useState<ModuleStatistics | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const [marksList, setMarksList] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Module creation state
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleTotalMarks, setNewModuleTotalMarks] = useState<number | "">("");
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // Marks entry state
  const [marksData, setMarksData] = useState<
    Record<string, { obtainedMarks: number | "" }>
  >({});
  const [savingMarks, setSavingMarks] = useState(false);

  // Load data when course changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadCourseData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [studentsResult, modulesResult] = await Promise.all([
          fetch(`/api/enrollments?courseId=${selectedCourseId}`).then((r) => r.json()),
          fetch(`/api/modules?courseId=${selectedCourseId}`).then((r) => r.json()),
        ]);

        if (studentsResult.success) {
          setStudents(studentsResult.students || []);
        }

        if (modulesResult.success) {
          const loadedModules = modulesResult.modules || [];
          setModules(loadedModules);
          if (loadedModules.length > 0 && !selectedModuleId) {
            setSelectedModuleId(loadedModules[0].module_id);
          }
        }
      } catch {
        setError("Failed to load course data.");
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  // Load marks when module changes
  useEffect(() => {
    if (!selectedCourseId || !selectedModuleId) return;

    const loadMarks = async () => {
      try {
        const response = await fetch(
          `/api/marks?courseId=${selectedCourseId}&moduleId=${selectedModuleId}`,
        );
        const result = await response.json();

        if (result.success) {
          setMarksList(result.marks || []);
          setStatistics(result.statistics || null);

          // Initialize marks data for edit mode
          const data: Record<string, { obtainedMarks: number | "" }> = {};
          students.forEach((student) => {
            const existing = result.marks?.find(
              (m: MarkEntry) => m.student_id === student.student_id,
            );
            data[student.student_id] = {
              obtainedMarks:
                existing?.obtained_marks !== null &&
                existing?.obtained_marks !== undefined
                  ? existing.obtained_marks
                  : "",
            };
          });
          setMarksData(data);
        } else {
          console.error("Failed to load marks:", result.error);
        }
      } catch (err) {
        console.error("Failed to load marks:", err);
      }
    };

    if (students.length > 0) {
      loadMarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId, selectedCourseId, students.length]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
    setModules([]);
    setStudents([]);
    setStatistics(null);
    setMarksData({});
    router.push(`/teacher/marks?course=${courseId}`);
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
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
      selectedCourseId,
      newModuleName.trim(),
      typeof newModuleTotalMarks === "number" ? newModuleTotalMarks : 0,
    );

    if (!result.success) {
      setModuleError(result.error);
      setCreatingModule(false);
      return;
    }

    // Refetch modules after successful creation
    try {
      const modulesResponse = await fetch(`/api/modules?courseId=${selectedCourseId}`);
      const modulesResult = await modulesResponse.json();

      if (modulesResult.success) {
        const loadedModules = modulesResult.modules || [];
        setModules(loadedModules);
        // Auto-select the newly created module
        if (result.module) {
          setSelectedModuleId(result.module.module_id);
        } else if (loadedModules.length > 0) {
          setSelectedModuleId(loadedModules[loadedModules.length - 1].module_id);
        }
      }
    } catch (err) {
      console.error("Failed to refresh modules:", err);
    }

    setShowCreateModule(false);
    setNewModuleName("");
    setNewModuleTotalMarks("");
    setCreatingModule(false);
  };

  const handleMarkChange = (studentId: string, value: string | number) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        obtainedMarks:
          value === ""
            ? ""
            : typeof value === "number"
              ? value
              : parseFloat(value as string) || 0,
      },
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMarks(true);
    setError(null);
    setSuccess(false);

    if (!selectedModuleId) {
      setError("Please select a module.");
      setSavingMarks(false);
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

      if (obtainedMarks >= 0) {
        recordsToSave.push({
          studentId: student.student_id,
          obtainedMarks,
        });
      }
    }

    if (recordsToSave.length === 0) {
      setError("Please enter marks for at least one student.");
      setSavingMarks(false);
      return;
    }

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
      setSavingMarks(false);
      return;
    }

    setSuccess(true);
    setSavingMarks(false);
    router.refresh();
  };

  // Calculate real-time statistics from all entered marks
  const calculateRealTimeStats = () => {
    if (!selectedModule || students.length === 0) return null;

    const allMarks = students
      .map((student) => {
        const data = marksData[student.student_id];
        const marks = typeof data?.obtainedMarks === "number" ? data.obtainedMarks : null;
        return marks;
      })
      .filter((m): m is number => m !== null && m !== undefined);

    if (allMarks.length === 0) return null;

    const n = allMarks.length;
    const sum = allMarks.reduce((a, b) => a + b, 0);
    const average = sum / n;

    // Calculate standard deviation
    const variance = allMarks.reduce((sum, mark) => sum + (mark - average) ** 2, 0) / n;
    const stdDeviation = Math.sqrt(variance);

    const minMarks = Math.min(...allMarks);
    const maxMarks = Math.max(...allMarks);

    // Calculate median
    const sortedMarks = [...allMarks].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const medianMarks = n % 2 === 0 ? (sortedMarks[mid - 1] + sortedMarks[mid]) / 2 : sortedMarks[mid];

    return {
      average,
      stdDeviation,
      minMarks,
      maxMarks,
      medianMarks,
      totalMarks: selectedModule.total_marks,
    };
  };

  const getRemarks = (
    obtainedMarks: number,
  ): { text: string; icon: React.ReactNode; color: string } => {
    // Use real-time statistics if available, otherwise fall back to saved statistics
    const realTimeStats = calculateRealTimeStats();
    const currentStats = realTimeStats || statistics;

    // If no statistics available, return neutral remark
    if (!currentStats || currentStats.totalMarks === 0 || currentStats.average === undefined) {
      return {
        text: "No data available",
        icon: <Minus className="h-4 w-4" />,
        color: "text-slate-500",
      };
    }

    const diff = obtainedMarks - currentStats.average;
    const stdDev = Math.max(currentStats.stdDeviation || 0.1, 0.1); // Ensure stdDev is not 0

    // Logic: Compare student's marks with class average using standard deviation
    // Excellent: More than 1 std dev above average
    // Good: Above average but within 1 std dev
    // Average: Within 1 std dev of average (both above and below)
    // Below average: More than 1 std dev below average

    if (diff > stdDev) {
      // More than 1 standard deviation above average
      return {
        text: "Excellent! Well above average",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-600",
      };
    } else if (diff > 0) {
      // Above average but within 1 standard deviation
      return {
        text: "Good! Above average",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-500",
      };
    } else if (diff >= -stdDev) {
      // Within 1 standard deviation below average (or at average)
      // This includes: diff between -stdDev and 0 (inclusive)
      return {
        text: "Average performance",
        icon: <Minus className="h-4 w-4" />,
        color: "text-yellow-600",
      };
    } else {
      // More than 1 standard deviation below average
      return {
        text: "Below average - needs improvement",
        icon: <TrendingDown className="h-4 w-4" />,
        color: "text-red-600",
      };
    }
  };

  const selectedModule = modules.find((m) => m.module_id === selectedModuleId);

  return (
    <div className="mt-8 space-y-6">
      {/* Course Selection */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <label
          htmlFor="course"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Select Course:
        </label>
        <select
          id="course"
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
        >
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.course_code} - {course.course_name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
          Loading course data...
        </div>
      )}

      {!loading && selectedCourseId && (
        <>
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
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value) || 0,
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

            {modules.length === 0 ? (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                No modules found. Create a module to start entering marks.
              </div>
            ) : (
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

          {/* View/Edit Mode Toggle */}
          {selectedModuleId && modules.length > 0 && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewMode("view")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "view"
                    ? "bg-[#4F46E5] text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                View Marks
              </button>
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "edit"
                    ? "bg-[#4F46E5] text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Edit Marks
              </button>
            </div>
          )}

          {/* Marks Entry/View Form */}
          {students.length === 0 ? (
            <div className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
              No students enrolled in this course yet. Students must enroll before
              you can enter marks.
            </div>
          ) : modules.length === 0 ? (
            <div className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
              Please create a module first before entering marks.
            </div>
          ) : viewMode === "view" ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                View Marks for {selectedModule?.module_name}
              </h3>

              {/* Statistics Table */}
              {statistics && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
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

              {/* Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Registration
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Marks Obtained
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Percentage
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        vs Average
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No marks entered yet for this module.
                        </td>
                      </tr>
                    ) : (
                      marksList.map((mark) => {
                        const percentage =
                          selectedModule && selectedModule.total_marks > 0
                            ? Math.round(
                                (mark.obtained_marks / selectedModule.total_marks) * 100,
                              )
                            : null;
                        const diffFromAverage =
                          statistics && statistics.average > 0
                            ? mark.obtained_marks - statistics.average
                            : null;

                        return (
                          <tr key={mark.mark_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-[#EEF2FF] p-1.5 text-[#4F46E5]">
                                  <GraduationCap className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                  {mark.student_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {mark.registration_number || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                              {mark.obtained_marks} / {selectedModule?.total_marks || 0}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                              {percentage !== null ? `${percentage}%` : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {diffFromAverage !== null ? (
                                <span
                                  className={`text-xs font-medium ${
                                    diffFromAverage >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {diffFromAverage >= 0 ? "+" : ""}
                                  {diffFromAverage.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveMarks} className="space-y-6">
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
                      typeof data.obtainedMarks === "number"
                        ? data.obtainedMarks
                        : 0;
                    const percentage =
                      selectedModule && selectedModule.total_marks > 0
                        ? Math.round(
                            (obtainedMarks / selectedModule.total_marks) * 100,
                          )
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
                                  diffFromAverage >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
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
                              Marks Obtained (out of{" "}
                              {selectedModule?.total_marks || 0})
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
                  type="submit"
                  disabled={savingMarks || !selectedModuleId}
                  className="rounded-xl bg-[#4F46E5] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingMarks ? "Saving..." : "Save Marks"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

