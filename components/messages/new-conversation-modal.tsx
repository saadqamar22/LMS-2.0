"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, X, ChevronRight, ChevronLeft } from "lucide-react";
import { createConversation, getTeacherCoursesWithStudents } from "@/app/actions/messages";
import type { CourseWithStudents, CourseStudent } from "@/app/actions/messages";

export function NewConversationModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"course" | "student">("course");
  const [courses, setCourses] = useState<CourseWithStudents[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStudents | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<CourseStudent | null>(null);
  const [includeParent, setIncludeParent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleOpen() {
    setOpen(true);
    setStep("course");
    setSelectedCourse(null);
    setSelectedStudent(null);
    setIncludeParent(false);
    setError(null);
    setLoading(true);

    const result = await getTeacherCoursesWithStudents();
    setLoading(false);
    if (result.success) {
      setCourses(result.courses);
    } else {
      setError(result.error ?? "Failed to load courses");
    }
  }

  function handleClose() {
    setOpen(false);
    setStep("course");
    setSelectedCourse(null);
    setSelectedStudent(null);
    setIncludeParent(false);
    setError(null);
  }

  function selectCourse(course: CourseWithStudents) {
    setSelectedCourse(course);
    setSelectedStudent(null);
    setIncludeParent(false);
    setStep("student");
  }

  function handleStart() {
    if (!selectedStudent) return;
    setError(null);

    startTransition(async () => {
      const participantIds = [selectedStudent.user_id];
      if (includeParent && selectedStudent.parent) {
        participantIds.push(selectedStudent.parent.user_id);
      }

      const title =
        includeParent && selectedStudent.parent
          ? `${selectedStudent.full_name} & ${selectedStudent.parent.full_name}`
          : undefined;

      const result = await createConversation(participantIds, title);
      if (result.success && result.conversationId) {
        handleClose();
        router.push(`/teacher/messages/${result.conversationId}`);
      } else {
        setError(result.error ?? "Failed to create conversation");
      }
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--role-primary)" }}
      >
        <MessageSquarePlus className="h-4 w-4" />
        New conversation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                {step === "student" && (
                  <button
                    onClick={() => setStep("course")}
                    className="mr-1 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-base font-semibold text-slate-900">New conversation</h3>
                  <p className="text-xs text-slate-400">
                    {step === "course" ? "Step 1 — Select a course" : `Step 2 — Select student in ${selectedCourse?.course_name}`}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
              ) : step === "course" ? (
                /* ── Step 1: Course list ── */
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {courses.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">No courses found</p>
                  ) : (
                    courses.map((course) => (
                      <button
                        key={course.course_id}
                        onClick={() => selectCourse(course)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{course.course_name}</p>
                          <p className="text-xs text-slate-400">
                            {course.students.length} student{course.students.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* ── Step 2: Student list ── */
                <>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {!selectedCourse?.students.length ? (
                      <p className="py-8 text-center text-sm text-slate-400">No students enrolled</p>
                    ) : (
                      selectedCourse.students.map((student) => (
                        <button
                          key={student.user_id}
                          onClick={() => {
                            setSelectedStudent(student);
                            setIncludeParent(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                            selectedStudent?.user_id === student.user_id
                              ? "bg-slate-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                            {student.parent && (
                              <p className="text-xs text-slate-400">Parent: {student.parent.full_name}</p>
                            )}
                          </div>
                          {selectedStudent?.user_id === student.user_id && (
                            <div
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: "var(--role-primary)" }}
                            />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Include parent option */}
                  {selectedStudent?.parent && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={includeParent}
                        onChange={(e) => setIncludeParent(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Include parent — {selectedStudent.parent.full_name}
                        </p>
                        <p className="text-xs text-slate-400">Creates a 3-person group conversation</p>
                      </div>
                    </label>
                  )}
                </>
              )}

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={handleClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              {step === "student" && (
                <button
                  onClick={handleStart}
                  disabled={!selectedStudent || isPending}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--role-primary)" }}
                >
                  {isPending ? "Starting…" : "Start conversation"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
