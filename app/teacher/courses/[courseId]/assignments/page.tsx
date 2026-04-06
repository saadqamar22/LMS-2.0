import { DashboardShell } from "@/components/dashboard-shell";
import { getCourseAssignments } from "@/app/actions/assignments";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssignmentsPageClient } from "./assignments-page-client";

interface TeacherAssignmentsPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ create?: string }>;
}

export default async function TeacherAssignmentsPage({
  params,
  searchParams,
}: TeacherAssignmentsPageProps) {
  const { courseId } = await params;
  const { create } = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const assignmentsResult = await getCourseAssignments(courseId);

  if (!assignmentsResult.success) {
    return (
      <DashboardShell role="teacher">
        <div className="mb-4">
          <Link
            href={`/teacher/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>
        </div>
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {assignmentsResult.error}
        </div>
      </DashboardShell>
    );
  }

  const assignments = assignmentsResult.assignments;

  return (
    <DashboardShell role="teacher">
      <div className="mb-4">
        <Link
          href={`/teacher/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Link>
      </div>

      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Assignments
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Course Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage assignments for this course
          </p>
        </div>
      </section>

      <AssignmentsPageClient
        courseId={courseId}
        assignments={assignments}
        showCreateForm={create === "true"}
      />
    </DashboardShell>
  );
}

