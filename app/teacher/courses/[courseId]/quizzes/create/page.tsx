import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCourseById } from "@/app/actions/courses";
import { CreateQuizForm } from "./create-quiz-form";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CreateQuizPage({ params }: PageProps) {
  const { courseId } = await params;
  const courseResult = await getCourseById(courseId);
  if (!courseResult.success) notFound();

  return (
    <DashboardShell role="teacher">
      <section className="flex items-center gap-4">
        <Link
          href={`/teacher/courses/${courseId}/quizzes`}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {courseResult.course.course_code}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Create Quiz</h1>
        </div>
      </section>

      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[var(--shadow-card)]">
          <CreateQuizForm courseId={courseId} />
        </div>
      </div>
    </DashboardShell>
  );
}
