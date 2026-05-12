import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { generateText } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "parent")
    return NextResponse.json({ error: "Only parents can translate reports." }, { status: 403 });

  const { text, targetLang } = await request.json();
  if (!text || !targetLang)
    return NextResponse.json({ error: "Missing text or targetLang." }, { status: 400 });

  const prompt =
    targetLang === "ur"
      ? `Translate the following academic progress report from English to Urdu.

Rules:
- Preserve ALL markdown formatting characters exactly as they appear: ##, ###, **, *, -, 1., etc.
- Keep all numbers, percentages, dates, and proper nouns (student names, subject names, course codes) unchanged in their original form.
- Translate all other prose naturally and formally in Pakistani standard Urdu.
- Do NOT add any introduction, commentary, or explanation — output only the translated report.

Report to translate:
${text}`
      : `Translate the following academic progress report from Urdu to English.

Rules:
- Preserve ALL markdown formatting characters exactly as they appear: ##, ###, **, *, -, 1., etc.
- Keep all numbers, percentages, dates, and proper nouns unchanged.
- Translate all other prose naturally and formally.
- Do NOT add any introduction or commentary — output only the translated report.

Report to translate:
${text}`;

  try {
    const translatedText = await generateText(prompt);
    return NextResponse.json({ translatedText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Translation failed." }, { status: 500 });
  }
}
