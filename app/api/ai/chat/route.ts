import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { messages, context } = await request.json();
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Messages are required." }, { status: 400 });
  }

  try {
    const model = getGeminiModel();

    const systemPrompt = `You are an intelligent academic assistant for a Learning Management System (LMS) called ILMS.
You help students, teachers, parents, and admins with academic questions, course content, assignments, and general education queries.
The user's role is: ${session.role}.
${context ? `Additional context: ${context}` : ""}
Be concise, helpful, and educational. Format responses with markdown when appropriate.`;

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I'm your ILMS academic assistant. How can I help you today?" }] },
        ...history,
      ],
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Gemini chat error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
