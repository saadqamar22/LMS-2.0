import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherCourses } from "@/app/actions/courses";
import { getCourseAssignments, type Assignment } from "@/app/actions/assignments";
import { getAssignmentSubmissions } from "@/app/actions/submissions";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AssignmentsDashboardClient } from "./assignments-dashboard-client";

interface TeacherAssignmentsDashboardProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function TeacherAssignmentsDashboardPage({
  searchParams,
}: TeacherAssignmentsDashboardProps) {
  const { course: selectedCourseId } = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const coursesResult = await getTeacherCourses();

  if (!coursesResult.success) {
    return (
      <DashboardShell role="teacher">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {coursesResult.error}
        </div>
      </DashboardShell>
    );
  }

  const courses = coursesResult.courses;

  // If a course is selected, fetch assignments and submissions
  let assignments: Assignment[] = [];
  let assignmentsWithSubmissions: Array<{
    assignment: typeof assignments[0];
    submissionCount: number;
    gradedCount: number;
  }> = [];

  if (selectedCourseId) {
    const assignmentsResult = await getCourseAssignments(selectedCourseId);
    if (assignmentsResult.success) {
      assignments = assignmentsResult.assignments;

      // Fetch submission counts for each assignment
      assignmentsWithSubmissions = await Promise.all(
        assignments.map(async (assignment) => {
          const submissionsResult = await getAssignmentSubmissions(
            assignment.assignment_id,
          );
          const submissions = submissionsResult.success
            ? submissionsResult.submissions
            : [];
          const gradedCount = submissions.filter(
            (s) => s.marks !== null && s.marks !== undefined,
          ).length;

          return {
            assignment,
            submissionCount: submissions.length,
            gradedCount,
          };
        }),
      );
    }
  }

  return (
    <DashboardShell role="teacher">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Assignments Management
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          All Assignments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a course to view and manage all assignments and submissions
        </p>
      </section>

      <AssignmentsDashboardClient
        courses={courses}
        selectedCourseId={selectedCourseId || null}
        assignmentsWithSubmissions={assignmentsWithSubmissions}
      />
    </DashboardShell>
  );
}

