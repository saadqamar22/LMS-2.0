"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Calendar, Users, CheckCircle2, Clock, ArrowRight, Download } from "lucide-react";
import type { Assignment } from "@/app/actions/assignments";
import type { Course } from "@/app/actions/courses";
import { EmptyState } from "@/components/empty-state";

interface AssignmentsDashboardClientProps {
  courses: Course[];
  selectedCourseId: string | null;
  assignmentsWithSubmissions: Array<{
    assignment: Assignment;
    submissionCount: number;
    gradedCount: number;
  }>;
}

export function AssignmentsDashboardClient({
  courses,
  selectedCourseId,
  assignmentsWithSubmissions,
}: AssignmentsDashboardClientProps) {
  const router = useRouter();

  const handleCourseChange = (courseId: string) => {
    if (courseId) {
      router.push(`/teacher/assignments?course=${courseId}`);
    } else {
      router.push(`/teacher/assignments`);
    }
  };

  const selectedCourse = courses.find((c) => c.course_id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <label
          htmlFor="course-select"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Select Course:
        </label>
        <select
          id="course-select"
          value={selectedCourseId || ""}
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

      {/* Assignments List */}
      {selectedCourseId ? (
        assignmentsWithSubmissions.length === 0 ? (
          <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedCourse?.course_name} Assignments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  No assignments yet
                </p>
              </div>
              <Link
                href={`/teacher/courses/${selectedCourseId}/assignments?create=true`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA]"
              >
                <FileText className="h-4 w-4" />
                Create Assignment
              </Link>
            </div>
            <EmptyState
              title="No assignments yet"
              description="Create assignments for this course to get started."
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedCourse?.course_name} Assignments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {assignmentsWithSubmissions.length} assignment
                  {assignmentsWithSubmissions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href={`/teacher/courses/${selectedCourseId}/assignments?create=true`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA]"
              >
                <FileText className="h-4 w-4" />
                Create Assignment
              </Link>
            </div>

            {assignmentsWithSubmissions.map(({ assignment, submissionCount, gradedCount }) => {
              const deadline = new Date(assignment.deadline);
              const now = new Date();
              const isOverdue = deadline < now;
              const daysUntilDeadline = Math.ceil(
                (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );

              return (
                <div
                  key={assignment.assignment_id}
                  className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#4F46E5]" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          {assignment.title}
                        </h3>
                      </div>

                      {assignment.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                          {assignment.description}
                        </p>
                      )}

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-medium text-slate-500">Deadline</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {deadline.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Submissions
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {submissionCount}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-medium text-slate-500">Graded</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {gradedCount} / {submissionCount}
                            </p>
                          </div>
                        </div>
                      </div>

                      {assignment.file_url && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <Download className="h-4 w-4 text-[#4F46E5]" />
                          <span className="text-xs font-medium text-slate-600">
                            Assignment file attached
                          </span>
                        </div>
                      )}

                      {isOverdue && (
                        <div className="mt-4 rounded-xl bg-red-50 p-2 text-xs text-red-800">
                          Deadline passed {Math.abs(daysUntilDeadline)} days ago
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <Link
                        href={`/teacher/courses/${selectedCourseId}/assignments/${assignment.assignment_id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
                      >
                        View Submissions
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      {gradedCount < submissionCount && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                          <Clock className="h-3.5 w-3.5" />
                          Pending: {submissionCount - gradedCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          title="Select a course"
          description="Choose a course from the dropdown above to view and manage assignments."
        />
      )}
    </div>
  );
}

