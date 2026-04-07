import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { text, mode } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Text is required." }, { status: 400 });
  if (text.length > 50000) return NextResponse.json({ error: "Text is too long (max 50,000 characters)." }, { status: 400 });

  const summaryMode = mode || "concise";

  const modeInstructions: Record<string, string> = {
    concise: "Write a concise summary in 3-5 bullet points capturing the key ideas.",
    detailed: "Write a detailed structured summary with headings and sub-points covering all major concepts.",
    "key-points": "Extract and list only the most important key points and facts as numbered items.",
    "study-notes": "Format this as study notes a student can use for revision: key definitions, concepts, and examples clearly organized.",
  };

  const instruction = modeInstructions[summaryMode] || modeInstructions.concise;

  try {
    const model = getGeminiModel();

    const prompt = `You are an academic content summarizer for an LMS.

${instruction}

Use markdown formatting (bold for key terms, bullet points, headers where appropriate).

Content to summarize:
---
${text}
---`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Gemini summarizer error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
