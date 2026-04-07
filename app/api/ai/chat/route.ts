import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { chatCompletion } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { messages, context } = await request.json();
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Messages are required." }, { status: 400 });
  }

  const systemPrompt = `You are an intelligent academic assistant for a Learning Management System (LMS) called ILMS.
You help students, teachers, parents, and admins with academic questions, course content, assignments, and general education queries.
The user's role is: ${session.role}.
${context ? `Additional context: ${context}` : ""}
Be concise, helpful, and educational. Format responses with markdown when appropriate.`;

  try {
    const reply = await chatCompletion(messages, systemPrompt);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
