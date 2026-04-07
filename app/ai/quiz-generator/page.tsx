import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { getTeacherCourses } from "@/app/actions/courses";
import { EmptyState } from "@/components/empty-state";
import { QuizGeneratorClient } from "./quiz-generator-client";

export default async function AIQuizGeneratorPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  if (currentUser.role !== "teacher") {
    return (
      <DashboardShell role={currentUser.role as "student" | "teacher" | "parent" | "admin"}>
        <EmptyState title="Teachers only" description="The AI Quiz Generator is only available to teachers." />
      </DashboardShell>
    );
  }

  const coursesResult = await getTeacherCourses();
  const courses = coursesResult.success ? coursesResult.courses : [];

  return (
    <DashboardShell role="teacher">
      <section>
        <p className="text-xs uppercase tracking-wide text-slate-400">AI Tools</p>
        <h1 className="text-2xl font-semibold text-slate-900">AI Quiz Generator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter a topic and let AI generate quiz questions. Review, edit, then save directly to a course.
        </p>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create a course first, then come back to generate quizzes."
          actionLabel="Create a course"
          actionHref="/teacher/create-course"
        />
      ) : (
        <QuizGeneratorClient courses={courses} />
      )}
    </DashboardShell>
  );
}
