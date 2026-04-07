import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "teacher")
    return NextResponse.json({ error: "Only teachers can generate quizzes." }, { status: 403 });

  const { topic, numQuestions, types, difficulty } = await request.json();

  if (!topic?.trim()) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const questionTypes: string[] = types && types.length > 0 ? types : ["mcq"];
  const count = Math.min(Math.max(parseInt(numQuestions) || 5, 1), 20);

  try {
    const model = getGeminiModel();

    const typeInstructions = questionTypes
      .map((t: string) => {
        if (t === "mcq") return "MCQ: 4 options (A, B, C, D), one correct";
        if (t === "true_false") return "True/False: answer is exactly 'True' or 'False'";
        if (t === "short_answer") return "Short Answer: a brief expected answer phrase";
        return t;
      })
      .join("; ");

    const prompt = `Generate exactly ${count} quiz questions about "${topic}" with difficulty level: ${difficulty || "medium"}.
Question types to include: ${typeInstructions}.

Respond ONLY with a valid JSON array. No markdown, no explanation, no code block. Raw JSON only.

Each object must have these exact fields:
- "question_text": string
- "type": one of "mcq", "true_false", "short_answer"
- "options": array of 4 strings for mcq, null for others
- "correct_answer": string (for mcq: exact option text; for true_false: "True" or "False"; for short_answer: expected answer)
- "marks": number (1-5)

Example:
[{"question_text":"What is 2+2?","type":"mcq","options":["2","3","4","5"],"correct_answer":"4","marks":1}]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown code block if present
    text = text.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

    let questions;
    try {
      questions = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "AI returned unexpected format." }, { status: 500 });
    }

    // Sanitize
    const sanitized = questions.map((q: any) => ({
      question_text: String(q.question_text || "").trim(),
      type: ["mcq", "true_false", "short_answer"].includes(q.type) ? q.type : "mcq",
      options: q.type === "mcq" && Array.isArray(q.options) ? q.options.map(String) : null,
      correct_answer: String(q.correct_answer || "").trim(),
      marks: Math.min(Math.max(parseInt(q.marks) || 1, 1), 10),
    }));

    return NextResponse.json({ questions: sanitized });
  } catch (err) {
    console.error("Gemini quiz generator error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
