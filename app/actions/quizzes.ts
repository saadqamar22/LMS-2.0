"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface Quiz {
  quiz_id: string;
  course_id: string;
  teacher_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  total_marks: number;
  time_limit_mins: number | null;
  is_published: boolean;
  grading_mode: "auto" | "manual";
  rubric: string | null;
  created_at: string | null;
}

export interface Question {
  question_id: string;
  quiz_id: string;
  question_text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[] | null;
  correct_answer: string;
  marks: number;
  order_index: number;
}

export interface QuizAttempt {
  attempt_id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string> | null;
  score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  student_name?: string;
  registration_number?: string | null;
}

// ─── Teacher: create quiz ───────────────────────────────────────────────────

export async function createQuiz(input: {
  courseId: string;
  title: string;
  description?: string;
  totalMarks: number;
  timeLimitMins?: number;
  gradingMode?: "auto" | "manual";
  rubric?: string;
}): Promise<{ success: true; quizId: string } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Only teachers can create quizzes." };
  if (!input.title?.trim()) return { success: false, error: "Title is required." };
  if (input.totalMarks < 1) return { success: false, error: "Total marks must be at least 1." };

  try {
    const supabase = createAdminClient();

    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("course_id", input.courseId)
      .single();
    if (!course || (course as any).teacher_id !== session.userId)
      return { success: false, error: "Course not found or access denied." };

    const { data, error } = await (supabase.from("quizzes") as any)
      .insert([{
        course_id: input.courseId,
        teacher_id: session.userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        total_marks: input.totalMarks,
        time_limit_mins: input.timeLimitMins || null,
        is_published: false,
        grading_mode: input.gradingMode || "auto",
        rubric: input.rubric?.trim() || null,
      }])
      .select("quiz_id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${input.courseId}/quizzes`);
    return { success: true, quizId: data.quiz_id };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: add question ──────────────────────────────────────────────────

export async function addQuestion(input: {
  quizId: string;
  questionText: string;
  type: "mcq" | "true_false" | "short_answer";
  options?: string[];
  correctAnswer: string;
  marks: number;
  orderIndex?: number;
}): Promise<{ success: true; questionId: string } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Only teachers can add questions." };

  try {
    const supabase = createAdminClient();

    // Verify teacher owns the quiz
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("teacher_id, course_id, is_published")
      .eq("quiz_id", input.quizId)
      .single();
    if (!quiz) return { success: false, error: "Quiz not found." };
    const q = quiz as any;
    if (q.teacher_id !== session.userId) return { success: false, error: "Access denied." };
    if (q.is_published) return { success: false, error: "Cannot edit a published quiz." };

    // Get next order index
    const { data: existingQuestions } = await supabase
      .from("questions")
      .select("order_index")
      .eq("quiz_id", input.quizId)
      .order("order_index", { ascending: false })
      .limit(1);
    const nextIndex =
      input.orderIndex ??
      ((existingQuestions as any[])?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await (supabase.from("questions") as any)
      .insert([{
        quiz_id: input.quizId,
        question_text: input.questionText.trim(),
        type: input.type,
        options: input.type === "mcq" ? input.options : null,
        correct_answer: input.correctAnswer,
        marks: input.marks,
        order_index: nextIndex,
      }])
      .select("question_id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${q.course_id}/quizzes/${input.quizId}`);
    return { success: true, questionId: data.question_id };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: delete question ───────────────────────────────────────────────

export async function deleteQuestion(
  questionId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    const { data: question } = await supabase
      .from("questions")
      .select("quiz_id, quizzes!inner(teacher_id, course_id)")
      .eq("question_id", questionId)
      .single();

    if (!question) return { success: false, error: "Question not found." };
    const q = question as any;
    if (q.quizzes.teacher_id !== session.userId) return { success: false, error: "Access denied." };

    const { error } = await (supabase.from("questions") as any)
      .delete()
      .eq("question_id", questionId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${q.quizzes.course_id}/quizzes/${q.quiz_id}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: publish / unpublish ──────────────────────────────────────────

export async function setQuizPublished(
  quizId: string,
  published: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    const { data: quiz } = await supabase
      .from("quizzes")
      .select("teacher_id, course_id")
      .eq("quiz_id", quizId)
      .single();

    if (!quiz) return { success: false, error: "Quiz not found." };
    const q = quiz as any;
    if (q.teacher_id !== session.userId) return { success: false, error: "Access denied." };

    // Must have at least one question before publishing
    if (published) {
      const { data: questions } = await supabase
        .from("questions")
        .select("question_id")
        .eq("quiz_id", quizId)
        .limit(1);
      if (!questions || questions.length === 0)
        return { success: false, error: "Add at least one question before publishing." };
    }

    const { error } = await (supabase.from("quizzes") as any)
      .update({ is_published: published })
      .eq("quiz_id", quizId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${q.course_id}/quizzes`);
    revalidatePath(`/teacher/courses/${q.course_id}/quizzes/${quizId}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: post quiz results to marks (creates new module) ───────────────

export async function postQuizMarksToSubject(
  quizId: string,
): Promise<{ success: true; moduleId: string } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    // Fetch quiz with attempts
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("*")
      .eq("quiz_id", quizId)
      .single();
    if (!quiz) return { success: false, error: "Quiz not found." };
    const q = quiz as any;
    if (q.teacher_id !== session.userId) return { success: false, error: "Access denied." };

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("student_id, score")
      .eq("quiz_id", quizId)
      .not("submitted_at", "is", null);

    if (!attempts || attempts.length === 0)
      return { success: false, error: "No submitted attempts to post." };

    // Create a new module for this quiz
    const { data: newModule, error: modError } = await (supabase.from("modules") as any)
      .insert([{
        course_id: q.course_id,
        module_name: `Quiz: ${q.title}`,
        total_marks: q.total_marks,
      }])
      .select("module_id")
      .single();

    if (modError || !newModule)
      return { success: false, error: modError?.message || "Failed to create module." };

    const moduleId = newModule.module_id;

    // Insert marks for each student who attempted
    const marksToInsert = (attempts as any[])
      .filter((a) => a.score !== null)
      .map((a) => ({
        student_id: a.student_id,
        module_id: moduleId,
        obtained_marks: a.score,
      }));

    if (marksToInsert.length > 0) {
      const { error: marksError } = await (supabase.from("marks") as any)
        .insert(marksToInsert);
      if (marksError) return { success: false, error: marksError.message };
    }

    // Link quiz to the new module
    await (supabase.from("quizzes") as any)
      .update({ module_id: moduleId })
      .eq("quiz_id", quizId);

    revalidatePath(`/teacher/courses/${q.course_id}/marks`);
    revalidatePath(`/student/marks`);
    return { success: true, moduleId };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Shared: get quiz with questions ───────────────────────────────────────

export async function getQuizWithQuestions(
  quizId: string,
): Promise<
  | { success: true; quiz: Quiz; questions: Question[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("quiz_id", quizId)
      .single();

    if (quizError || !quiz) return { success: false, error: "Quiz not found." };

    const q = quiz as any;
    // Students can only see published quizzes
    if (session.role === "student" && !q.is_published)
      return { success: false, error: "Quiz not available." };

    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });

    if (qError) return { success: false, error: qError.message };

    return {
      success: true,
      quiz: q as Quiz,
      questions: (questions || []) as Question[],
    };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: list quizzes for course ──────────────────────────────────────

export async function getQuizzesByCourse(
  courseId: string,
): Promise<{ success: true; quizzes: (Quiz & { attempt_count: number })[] } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    // Attach attempt counts
    const quizzes = await Promise.all(
      ((data || []) as Quiz[]).map(async (quiz) => {
        const { count } = await supabase
          .from("quiz_attempts")
          .select("attempt_id", { count: "exact", head: true })
          .eq("quiz_id", quiz.quiz_id)
          .not("submitted_at", "is", null);
        return { ...quiz, attempt_count: count ?? 0 };
      }),
    );

    return { success: true, quizzes };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: get attempts for a quiz ──────────────────────────────────────

export async function getQuizAttempts(
  quizId: string,
): Promise<{ success: true; attempts: QuizAttempt[] } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        attempt_id, quiz_id, student_id, answers, score, started_at, submitted_at,
        students!quiz_attempts_student_id_fkey (
          registration_number,
          users!students_id_fkey ( full_name )
        )
      `)
      .eq("quiz_id", quizId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    const attempts: QuizAttempt[] = ((data || []) as any[]).map((a) => ({
      attempt_id: a.attempt_id,
      quiz_id: a.quiz_id,
      student_id: a.student_id,
      answers: a.answers,
      score: a.score,
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      student_name: a.students?.users?.full_name || "Unknown",
      registration_number: a.students?.registration_number || null,
    }));

    return { success: true, attempts };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Student: get published quizzes for course ─────────────────────────────

export async function getPublishedQuizzesByCourse(
  courseId: string,
): Promise<
  | { success: true; quizzes: (Quiz & { attempted: boolean; score: number | null })[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "student") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    const quizzes = await Promise.all(
      ((data || []) as Quiz[]).map(async (quiz) => {
        const { data: attempt } = await supabase
          .from("quiz_attempts")
          .select("score, submitted_at")
          .eq("quiz_id", quiz.quiz_id)
          .eq("student_id", session.userId)
          .single();
        const a = attempt as any;
        return {
          ...quiz,
          attempted: !!(a?.submitted_at),
          score: a?.score ?? null,
        };
      }),
    );

    return { success: true, quizzes };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Student: submit quiz attempt ──────────────────────────────────────────

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, string>,
): Promise<{ success: true; score: number; total: number } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "student") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    // Verify quiz is published
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("is_published, total_marks, course_id, grading_mode")
      .eq("quiz_id", quizId)
      .single();
    if (!quiz || !(quiz as any).is_published)
      return { success: false, error: "Quiz not available." };

    // Check no previous submission
    const { data: existing } = await supabase
      .from("quiz_attempts")
      .select("attempt_id, submitted_at")
      .eq("quiz_id", quizId)
      .eq("student_id", session.userId)
      .single();
    if (existing && (existing as any).submitted_at)
      return { success: false, error: "You have already submitted this quiz." };

    // Fetch questions and auto-grade
    const { data: questions } = await supabase
      .from("questions")
      .select("question_id, correct_answer, marks, type")
      .eq("quiz_id", quizId);

    // short_answer is never auto-graded:
    //   manual mode → teacher grades via the results page
    //   auto mode   → Gemini integration pending
    let score = 0;
    for (const q of (questions || []) as any[]) {
      const studentAnswer = answers[q.question_id]?.trim().toLowerCase();
      const correct = q.correct_answer?.trim().toLowerCase();
      if (q.type !== "short_answer" && studentAnswer === correct) {
        score += q.marks;
      }
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing in-progress attempt
      await (supabase.from("quiz_attempts") as any)
        .update({ answers, score, submitted_at: now })
        .eq("attempt_id", (existing as any).attempt_id);
    } else {
      await (supabase.from("quiz_attempts") as any)
        .insert([{
          quiz_id: quizId,
          student_id: session.userId,
          answers,
          score,
          started_at: now,
          submitted_at: now,
        }]);
    }

    revalidatePath(`/student/courses/${(quiz as any).course_id}/quizzes`);
    return { success: true, score, total: (quiz as any).total_marks };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Student: get own attempt for a quiz ───────────────────────────────────

export async function getStudentAttempt(
  quizId: string,
): Promise<{ success: true; attempt: QuizAttempt | null } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("student_id", session.userId)
      .single();

    return { success: true, attempt: data as QuizAttempt | null };
  } catch {
    return { success: true, attempt: null };
  }
}

// ─── Student: get all pending (unattempted) published quizzes ───────────────

export async function getPendingQuizzesForStudent(): Promise<
  | {
      success: true;
      quizzes: (Quiz & { course_name: string; course_code: string })[];
    }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "student") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    // Get all enrolled course IDs
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", session.userId);

    if (!enrollments || enrollments.length === 0) return { success: true, quizzes: [] };

    const courseIds = (enrollments as any[]).map((e) => e.course_id);

    // Get all published quizzes for enrolled courses with course info
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*, courses!quizzes_course_id_fkey(course_name, course_code)")
      .in("course_id", courseIds)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    if (!quizzes || quizzes.length === 0) return { success: true, quizzes: [] };

    const quizIds = (quizzes as any[]).map((q) => q.quiz_id);

    // Find which ones the student already submitted
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id")
      .eq("student_id", session.userId)
      .not("submitted_at", "is", null)
      .in("quiz_id", quizIds);

    const submittedIds = new Set(((attempts || []) as any[]).map((a) => a.quiz_id));

    const pending = (quizzes as any[])
      .filter((q) => !submittedIds.has(q.quiz_id))
      .map((q) => ({
        ...q,
        grading_mode: q.grading_mode || "auto",
        rubric: q.rubric || null,
        course_name: q.courses?.course_name || "",
        course_code: q.courses?.course_code || "",
      }));

    return { success: true, quizzes: pending };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Student: get quiz result with answer breakdown ─────────────────────────

export async function getStudentQuizResult(quizId: string): Promise<
  | {
      success: true;
      quiz: Quiz;
      questions: Question[];
      attempt: QuizAttempt;
    }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "student") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    const { data: quizData, error: quizError } = await (supabase.from("quizzes") as any)
      .select("*")
      .eq("quiz_id", quizId)
      .single();

    if (quizError || !quizData) return { success: false, error: "Quiz not found." };

    const { data: attemptData, error: attemptError } = await (supabase.from("quiz_attempts") as any)
      .select("*")
      .eq("quiz_id", quizId)
      .eq("student_id", session.userId)
      .not("submitted_at", "is", null)
      .single();

    if (attemptError || !attemptData)
      return { success: false, error: "No submitted attempt found." };

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });

    if (qErr) return { success: false, error: qErr.message };

    return {
      success: true,
      quiz: quizData as Quiz,
      questions: (questions || []) as Question[],
      attempt: attemptData as QuizAttempt,
    };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Teacher: manually grade short_answer questions for an attempt ──────────

export async function gradeManualQuestions(
  attemptId: string,
  questionMarks: Record<string, number>, // questionId -> marks awarded
): Promise<{ success: true; newScore: number } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Access denied." };

  try {
    const supabase = createAdminClient();

    // Fetch attempt with quiz info
    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, answers, student_id")
      .eq("attempt_id", attemptId)
      .single();

    if (!attempt) return { success: false, error: "Attempt not found." };
    const a = attempt as any;

    // Verify teacher owns the quiz
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("teacher_id, course_id, grading_mode")
      .eq("quiz_id", a.quiz_id)
      .single();

    if (!quiz) return { success: false, error: "Quiz not found." };
    const q = quiz as any;
    if (q.teacher_id !== session.userId) return { success: false, error: "Access denied." };

    // Re-calculate auto score for mcq/true_false
    const { data: questions } = await supabase
      .from("questions")
      .select("question_id, correct_answer, marks, type")
      .eq("quiz_id", a.quiz_id);

    let autoScore = 0;
    for (const question of (questions || []) as any[]) {
      if (question.type === "short_answer") continue;
      const studentAnswer = a.answers?.[question.question_id]?.trim().toLowerCase();
      const correct = question.correct_answer?.trim().toLowerCase();
      if (studentAnswer === correct) autoScore += question.marks;
    }

    // Add teacher-awarded marks for short_answer questions
    let manualScore = 0;
    for (const [questionId, marks] of Object.entries(questionMarks)) {
      const question = ((questions || []) as any[]).find(
        (q) => q.question_id === questionId && q.type === "short_answer",
      );
      if (question) {
        manualScore += Math.min(Math.max(0, marks), question.marks); // clamp to [0, max]
      }
    }

    const newScore = autoScore + manualScore;

    const { error } = await (supabase.from("quiz_attempts") as any)
      .update({ score: newScore })
      .eq("attempt_id", attemptId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${q.course_id}/quizzes/${a.quiz_id}/results`);
    return { success: true, newScore };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}
