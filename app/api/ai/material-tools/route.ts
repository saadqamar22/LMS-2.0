import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { generateText } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/ai/material-tools
 *
 * tool: "quiz"      → generate practice quiz questions from content
 * tool: "notes"     → generate structured study notes
 * tool: "summary"   → summarize the content
 *
 * content source (one of):
 *   - text: string                  (pasted text)
 *   - materialId: string            (fetch file from storage and extract text)
 */

async function extractTextFromMaterial(materialId: string, session: { userId: string; role: string }): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: material } = await supabase
    .from("materials")
    .select("material_id, title, type, file_url, external_url, course_id")
    .eq("material_id", materialId)
    .single();

  if (!material) return null;
  const m = material as any;

  // Verify student is enrolled or teacher owns the course
  if (session.role === "student") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("student_id", session.userId)
      .eq("course_id", m.course_id)
      .maybeSingle();
    if (!enrollment) return null;
  } else if (session.role === "teacher") {
    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("course_id", m.course_id)
      .single();
    if (!course || (course as any).teacher_id !== session.userId) return null;
  }

  if (m.type === "link" || !m.file_url) {
    // For links, just return the title as context
    return `Material title: ${m.title}`;
  }

  // Extract the Supabase storage path from the file_url
  // file_url looks like /api/files?bucket=materials&path=...
  const url = new URL(m.file_url, "http://localhost");
  const storagePath = url.searchParams.get("path");
  if (!storagePath) return null;

  // Download the file from Supabase storage
  const { data: fileData, error } = await supabase.storage
    .from("materials")
    .download(storagePath);

  if (error || !fileData) return null;

  const buffer = Buffer.from(await fileData.arrayBuffer());

  if (m.type === "pdf") {
    try {
      // Dynamic import to avoid build-time issues
      const pdfModule = await import("pdf-parse");
      const pdfParse = (pdfModule as any).default ?? pdfModule;
      const parsed = await pdfParse(buffer);
      return parsed.text?.slice(0, 40000) || null; // cap at 40k chars
    } catch {
      return null;
    }
  }

  // For text-based files, decode as UTF-8
  return buffer.toString("utf-8").slice(0, 40000);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const { tool, text, materialId, numQuestions, types, difficulty, mode } = body;

  if (!tool) return NextResponse.json({ error: "Tool is required." }, { status: 400 });

  let content: string = "";

  if (materialId) {
    const extracted = await extractTextFromMaterial(materialId, session);
    if (!extracted) {
      return NextResponse.json({ error: "Could not read material content. Make sure you have access." }, { status: 400 });
    }
    content = extracted;
  } else if (text?.trim()) {
    content = text.trim().slice(0, 40000);
  } else {
    return NextResponse.json({ error: "Provide either text content or a material ID." }, { status: 400 });
  }

  if (!content.trim()) {
    return NextResponse.json({ error: "No content found to process." }, { status: 400 });
  }

  try {
    if (tool === "quiz") {
      const count = Math.min(Math.max(parseInt(numQuestions) || 5, 1), 20);
      const questionTypes: string[] = types?.length > 0 ? types : ["mcq"];
      const diff = difficulty || "medium";

      const typeInstructions = questionTypes.map((t: string) => {
        if (t === "mcq") return "MCQ: 4 options, one correct";
        if (t === "true_false") return "True/False: answer is exactly 'True' or 'False'";
        if (t === "short_answer") return "Short Answer: brief expected answer";
        return t;
      }).join("; ");

      const prompt = `You are a quiz generator. Based ONLY on the content below, generate exactly ${count} quiz questions at ${diff} difficulty.
Question types: ${typeInstructions}.

Respond ONLY with a valid JSON array. No markdown, no explanation. Raw JSON only.

Each object must have:
- "question_text": string
- "type": "mcq" | "true_false" | "short_answer"
- "options": array of 4 strings for mcq, null for others
- "correct_answer": string
- "marks": number (1-5)

CONTENT:
${content}`;

      let responseText = (await generateText(prompt)).trim();
      responseText = responseText.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

      let questions;
      try {
        questions = JSON.parse(responseText);
      } catch {
        return NextResponse.json({ error: "AI returned invalid format. Please try again." }, { status: 500 });
      }

      if (!Array.isArray(questions)) {
        return NextResponse.json({ error: "AI returned unexpected format." }, { status: 500 });
      }

      const sanitized = questions.map((q: any) => ({
        question_text: String(q.question_text || "").trim(),
        type: ["mcq", "true_false", "short_answer"].includes(q.type) ? q.type : "mcq",
        options: q.type === "mcq" && Array.isArray(q.options) ? q.options.map(String) : null,
        correct_answer: String(q.correct_answer || "").trim(),
        marks: Math.min(Math.max(parseInt(q.marks) || 1, 1), 10),
      }));

      return NextResponse.json({ questions: sanitized });
    }

    if (tool === "notes") {
      const prompt = `You are an academic assistant. Generate clear, well-structured study notes from the content below.

Format as markdown with:
- A brief overview paragraph
- Key concepts as sections with headings (##)
- Important definitions in **bold**
- Bullet points for lists of facts or steps
- A "Key Takeaways" section at the end

CONTENT:
${content}`;

      const notes = await generateText(prompt);
      return NextResponse.json({ notes });
    }

    if (tool === "summary") {
      const summaryMode = mode || "concise";
      const modeInstructions: Record<string, string> = {
        concise: "Write a concise summary in 3-5 bullet points.",
        detailed: "Write a detailed structured summary with headings.",
        "key-points": "List only the most important key points as numbered items.",
        "study-notes": "Format as revision study notes with definitions and examples.",
      };
      const instruction = modeInstructions[summaryMode] || modeInstructions.concise;

      const prompt = `You are an academic content summarizer. ${instruction}
Use markdown formatting.

CONTENT:
${content}`;

      const summary = await generateText(prompt);
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  } catch (err) {
    console.error("AI material-tools error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
