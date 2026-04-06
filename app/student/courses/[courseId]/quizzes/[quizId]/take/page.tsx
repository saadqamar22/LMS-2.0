import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getQuizWithQuestions, getStudentAttempt } from "@/app/actions/quizzes";
import { TakeQuizClient } from "./take-quiz-client";

interface PageProps {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function TakeQuizPage({ params }: PageProps) {
  const { courseId, quizId } = await params;
  const [quizResult, attemptResult] = await Promise.all([
    getQuizWithQuestions(quizId),
    getStudentAttempt(quizId),
  ]);

  if (!quizResult.success) notFound();
  const { quiz, questions } = quizResult;

  // Already submitted — redirect to quizzes list
  const attempt = attemptResult.success ? attemptResult.attempt : null;
  if (attempt?.submitted_at) {
    redirect(`/student/courses/${courseId}/quizzes`);
  }

  return (
    <DashboardShell role="student">
      <TakeQuizClient
        quiz={quiz}
        questions={questions}
        courseId={courseId}
      />
    </DashboardShell>
  );
}
