import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "ur";

  if (!text) return NextResponse.json({ error: "Missing text." }, { status: 400 });
  if (text.length > 200)
    return NextResponse.json({ error: "Text too long (max 200 chars)." }, { status: 400 });

  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8` +
    `&tl=${encodeURIComponent(lang)}` +
    `&client=tw-ob` +
    `&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
        Accept: "audio/mpeg, audio/*",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "TTS service unavailable." }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch audio." }, { status: 500 });
  }
}
