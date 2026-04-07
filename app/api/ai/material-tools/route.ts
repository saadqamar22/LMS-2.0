import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { generateText } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractDocumentText } from "@/lib/pdf-extract";

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

type ExtractResult = { text: string } | { error: string };

async function extractTextFromMaterial(
  materialId: string,
  session: { userId: string; role: string },
): Promise<ExtractResult> {
  const supabase = createAdminClient();

  const { data: material, error: matErr } = await supabase
    .from("materials")
    .select("material_id, title, type, file_url, external_url, course_id")
    .eq("material_id", materialId)
    .single();

  if (matErr || !material) {
    console.error("[material-tools] material fetch error:", matErr);
    return { error: "Material not found." };
  }

  const m = material as any;

  // Verify access
  if (session.role === "student") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("student_id", session.userId)
      .eq("course_id", m.course_id)
      .maybeSingle();
    if (!enrollment) return { error: "You are not enrolled in this course." };
  } else if (session.role === "teacher") {
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("course_id", m.course_id)
      .single();
    if (courseErr || !course) {
      console.error("[material-tools] course fetch error:", courseErr);
      return { error: "Course not found." };
    }
    if ((course as any).teacher_id !== session.userId) {
      return { error: "You do not own this course." };
    }
  }

  // Links have no extractable file
  if (m.type === "link") {
    return { text: `Material title: ${m.title}` };
  }

  if (m.type === "video" || m.type === "image") {
    return { error: `Cannot extract text from ${m.type} files. Upload a PDF or Word document instead.` };
  }

  if (!m.file_url) {
    return { error: "Material has no file attached." };
  }

  // Extract storage path from /api/files?bucket=materials&path=...
  let storagePath: string | null = null;
  try {
    const url = new URL(m.file_url, "http://localhost");
    storagePath = url.searchParams.get("path");
  } catch {
    return { error: "Invalid file URL format." };
  }

  if (!storagePath) {
    return { error: "Could not determine storage path from file URL." };
  }

  // Fetch via signed URL (most reliable way to get raw bytes from Supabase storage)
  const { data: signedData, error: signedErr } = await supabase.storage
    .from("materials")
    .createSignedUrl(storagePath, 60);

  if (signedErr || !signedData?.signedUrl) {
    return { error: `Could not generate file URL: ${signedErr?.message || "unknown error"}` };
  }

  const fetchRes = await fetch(signedData.signedUrl);
  if (!fetchRes.ok) {
    return { error: `File fetch failed: ${fetchRes.status} ${fetchRes.statusText}` };
  }

  const buffer = Buffer.from(await fetchRes.arrayBuffer());

  try {
    const text = await extractDocumentText(buffer);
    if (!text) return { error: "File appears to be empty or contains no extractable text." };
    return { text: text.slice(0, 40000) };
  } catch (e) {
    console.error("[material-tools] extract error:", e);
    return { error: `Could not extract text: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const { tool, text, materialId, numQuestions, types, difficulty, mode } = body;

  if (!tool) return NextResponse.json({ error: "Tool is required." }, { status: 400 });

  let content: string = "";

  if (materialId) {
    const result = await extractTextFromMaterial(materialId, session);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    content = result.text;
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
