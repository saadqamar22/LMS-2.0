import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseDetailsForStudent } from "@/app/actions/enrollments";
import { EnrollButton } from "../enroll-button";
import { BookOpen, CheckCircle2, User, FileText } from "lucide-react";
import { getStudentCourseAssignments } from "@/app/actions/assignments";
import { getStudentSubmission } from "@/app/actions/submissions";
import { AssignmentCard } from "@/components/assignment-card";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseDetailPage({
  params,
}: CoursePageProps) {
  const { courseId } = await params;
  const [courseResult, assignmentsResult] = await Promise.all([
    getCourseDetailsForStudent(courseId),
    getStudentCourseAssignments(courseId),
  ]);

  if (!courseResult.success) {
    if (courseResult.error.includes("not found")) {
      notFound();
    }
    return (
      <DashboardShell role="student">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {courseResult.error}
        </div>
      </DashboardShell>
    );
  }

  const { course, modules, isEnrolled } = courseResult;
  const assignments = assignmentsResult.success ? assignmentsResult.assignments : [];

  // Fetch submission status for each assignment and filter due/upcoming ones
  const assignmentsWithStatus = await Promise.all(
    assignments.map(async (assignment) => {
      const submissionResult = await getStudentSubmission(assignment.assignment_id);
      const submission = submissionResult.success ? submissionResult.submission : null;

      const deadline = new Date(assignment.deadline);
      const now = new Date();
      const isOverdue = deadline < now;
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let deadlineStatus: "upcoming" | "due_soon" | "overdue" = "upcoming";
      if (isOverdue) {
        deadlineStatus = "overdue";
      } else if (daysUntilDeadline <= 3) {
        deadlineStatus = "due_soon";
      }

      let submissionStatus: "submitted" | "graded" | "not_submitted" = "not_submitted";
      if (submission) {
        if (submission.marks !== null && submission.marks !== undefined) {
          submissionStatus = "graded";
        } else {
          submissionStatus = "submitted";
        }
      }

      return {
        assignment,
        submissionStatus,
        deadlineStatus,
        marks: submission?.marks || null,
        isDue: isOverdue || daysUntilDeadline <= 7, // Show assignments due within 7 days or overdue
      };
    }),
  );

  // Filter assignments that are due soon or overdue
  const dueAssignments = assignmentsWithStatus.filter((item) => item.isDue);

  return (
    <DashboardShell role="student">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {course.course_code}
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {course.course_name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {course.teacher_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Instructor: {course.teacher_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>
                  Created {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEnrolled ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Enrolled
              </div>
            ) : (
              <EnrollButton courseId={courseId} />
            )}
            <Link
              href="/student/courses"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to courses
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Course content
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Modules ({modules.length})
            </h2>
          </div>
        </div>

        {modules.length === 0 ? (
          <EmptyState
            title="No modules yet"
            description="This course doesn't have any modules yet. Check back later."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.module_id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#EEF2FF] p-2 text-[#4F46E5]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {module.module_name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Total marks: {module.total_marks}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isEnrolled && (
        <>
          {/* Due Assignments Section */}
          {dueAssignments.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Due Assignments
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Assignments Due Soon ({dueAssignments.length})
                  </h2>
                </div>
                <Link
                  href={`/student/courses/${courseId}/assignments`}
                  className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {dueAssignments.map(({ assignment, submissionStatus, deadlineStatus, marks }) => (
                  <AssignmentCard
                    key={assignment.assignment_id}
                    assignment={assignment}
                    submissionStatus={submissionStatus}
                    deadlineStatus={deadlineStatus}
                    marks={marks}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Quick Links Section */}
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <Link
              href={`/student/courses/${courseId}/assignments`}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#EEF2FF] p-2 text-[#4F46E5]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Assignments</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`/student/attendance?course=${courseId}`}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#EEF2FF] p-2 text-[#4F46E5]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Attendance</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    View your attendance records
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`/student/marks?course=${courseId}`}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#EEF2FF] p-2 text-[#4F46E5]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Marks</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    View your grades and marks
                  </p>
                </div>
              </div>
            </Link>
          </section>
        </>
      )}
    </DashboardShell>
  );
}

