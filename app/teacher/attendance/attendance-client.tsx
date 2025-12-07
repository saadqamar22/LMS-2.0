"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";
import {
  getAttendanceForDate,
  getAttendanceHistory,
} from "@/app/actions/attendance";
import { AttendanceForm } from "../courses/[courseId]/attendance/attendance-form";
import { EmptyState } from "@/components/empty-state";
import type { Course } from "@/app/actions/courses";
import type { Student } from "@/app/actions/enrollments";
import type { AttendanceEntry } from "@/app/actions/attendance";

interface AttendanceClientProps {
  courses: Course[];
  initialSelectedCourseId?: string;
}

export function AttendanceClient({
  courses,
  initialSelectedCourseId,
}: AttendanceClientProps) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialSelectedCourseId || "",
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<
    AttendanceEntry[]
  >([]);
  const [history, setHistory] = useState<Array<{ date: string; count: number }>>(
    [],
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourseData = async () => {
    if (!selectedCourseId) {
      setStudents([]);
      setExistingAttendance([]);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [studentsResult, attendanceResult, historyResult] = await Promise.all(
        [
          getEnrolledStudentsForCourse(selectedCourseId),
          getAttendanceForDate(selectedCourseId, selectedDate),
          getAttendanceHistory(selectedCourseId),
        ],
      );

      if (studentsResult.success) {
        setStudents(studentsResult.students);
      } else {
        setError(studentsResult.error);
      }

      if (attendanceResult.success) {
        setExistingAttendance(attendanceResult.attendance);
      }

      if (historyResult.success) {
        setHistory(historyResult.history);
      }
    } catch (err) {
      console.error("Error loading course data:", err);
      setError("Failed to load course data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, selectedDate]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    router.push(`/teacher/attendance?course=${courseId}`);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleAttendanceSaved = () => {
    loadCourseData();
  };

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <label
          htmlFor="course-select"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Select Course:
        </label>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
        >
          <option value="">-- Select a Course --</option>
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.course_name} ({course.course_code})
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Form */}
      {selectedCourseId ? (
        loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-500 shadow-[var(--shadow-card)]">
            Loading attendance data...
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
            No students enrolled in this course yet. Students must enroll before
            you can mark attendance.
          </div>
        ) : (
          <AttendanceForm
            courseId={selectedCourseId}
            students={students}
            selectedDate={selectedDate}
            existingAttendance={existingAttendance}
            history={history}
            onDateChange={handleDateChange}
            onAttendanceSaved={handleAttendanceSaved}
          />
        )
      ) : (
        <EmptyState
          title="Select a course"
          description="Please select a course from the dropdown above to mark and view attendance."
        />
      )}
    </div>
  );
}

