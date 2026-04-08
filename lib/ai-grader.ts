import { generateText } from "@/lib/ai";

export interface GradeResult {
  marks: number;
  feedback: string;
}

/**
 * Grade a short-answer quiz response using AI.
 * Called server-side from submitQuizAttempt.
 */
export async function gradeShortAnswer(
  questionText: string,
  studentAnswer: string,
  correctAnswer: string,
  maxMarks: number,
  rubric?: string | null,
): Promise<GradeResult> {
  if (!studentAnswer?.trim()) {
    return { marks: 0, feedback: "No answer provided." };
  }

  const rubricLine = rubric
    ? `\nGrading instructions from teacher: ${rubric}`
    : "";

  const prompt = `You are an AI quiz grader. Grade the following short answer response fairly and consistently.

Question: ${questionText}
Model/expected answer: ${correctAnswer}
Maximum marks: ${maxMarks}${rubricLine}

Student's answer: "${studentAnswer}"

Award marks based on correctness and understanding. Give partial marks for partially correct answers.

Respond ONLY with valid JSON (no markdown, no explanation):
{"marks": <integer 0-${maxMarks}>, "feedback": "<1-2 sentence constructive feedback to the student>"}`;

  try {
    let text = (await generateText(prompt)).trim();
    text = text.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(text);
    return {
      marks: Math.min(maxMarks, Math.max(0, Math.round(Number(parsed.marks) || 0))),
      feedback: String(parsed.feedback || "Graded by AI.").trim().slice(0, 400),
    };
  } catch {
    return { marks: 0, feedback: "Automatic grading could not be completed." };
  }
}
