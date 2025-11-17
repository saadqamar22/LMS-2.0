"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveAttendance, type AttendanceStatus } from "@/app/actions/attendance";
import type { EnrolledStudent } from "@/app/actions/enrollments";
import type { AttendanceEntry } from "@/app/actions/attendance";
import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";

interface AttendanceFormProps {
  courseId: string;
  students: EnrolledStudent[];
  selectedDate: string;
  existingAttendance: AttendanceEntry[];
  history: Array<{ date: string; count: number }>;
}

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string; icon: React.ReactNode; color: string }> = [
  { value: "present", label: "Present", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600" },
  { value: "absent", label: "Absent", icon: <XCircle className="h-4 w-4" />, color: "text-red-600" },
  { value: "late", label: "Late", icon: <Clock className="h-4 w-4" />, color: "text-yellow-600" },
];

export function AttendanceForm({
  courseId,
  students,
  selectedDate: initialDate,
  existingAttendance,
  history,
}: AttendanceFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize attendance records from existing data or default to "present"
  const initialRecords = useMemo(() => {
    const records: Record<string, AttendanceStatus> = {};
    students.forEach((student) => {
      const existing = existingAttendance.find(
        (a) => a.student_id === student.student_id,
      );
      records[student.student_id] = existing?.status || "present";
    });
    return records;
  }, [students, existingAttendance]);

  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, AttendanceStatus>
  >(initialRecords);

  // Reload when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    router.push(`/teacher/courses/${courseId}/attendance?date=${newDate}`);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
      student_id,
      status,
    }));

    const result = await saveAttendance({
      courseId,
      date: selectedDate,
      records,
    });

    if (!result.success) {
      setError(result.error);
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <label htmlFor="date" className="text-sm font-medium text-slate-700">
                Select Date:
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
              />
            </div>
            <div className="text-sm text-slate-600">
              {students.length} student{students.length !== 1 ? "s" : ""} enrolled
            </div>
          </div>

          <div className="space-y-3">
            {students.map((student) => {
              const currentStatus = attendanceRecords[student.student_id] || "present";
              return (
                <div
                  key={student.student_id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
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
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStatusChange(student.student_id, option.value)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          currentStatus === option.value
                            ? `border-[#4F46E5] bg-[#EEF2FF] ${option.color}`
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
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
            Attendance saved successfully!
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
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Attendance History
          </h3>
          <div className="space-y-2">
            {history.slice(0, 10).map((entry) => (
              <div
                key={entry.date}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
              >
                <span className="text-sm text-slate-600">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {entry.count} record{entry.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

