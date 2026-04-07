/**
 * Unified AI provider abstraction.
 *
 * To switch providers, set AI_PROVIDER in .env.local:
 *   AI_PROVIDER=groq    → uses Groq (llama-3.3-70b-versatile) via GROQ_API_KEY
 *   AI_PROVIDER=gemini  → uses Gemini (gemini-1.5-flash) via GEMINI_API_KEY
 *
 * Default: groq
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Groq ───────────────────────────────────────────────────────────────────

async function groqGenerateText(prompt: string): Promise<string> {
  const { default: Groq } = await import("groq-sdk");
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set.");

  const groq = new Groq({ apiKey });
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content || "";
}

async function groqChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
  const { default: Groq } = await import("groq-sdk");
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set.");

  const groq = new Groq({ apiKey });

  const formatted: { role: "system" | "user" | "assistant"; content: string }[] = [];
  if (systemPrompt) formatted.push({ role: "system", content: systemPrompt });
  formatted.push(...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: formatted,
    temperature: 0.7,
    max_tokens: 2048,
  });
  return response.choices[0]?.message?.content || "";
}

// ─── Gemini ─────────────────────────────────────────────────────────────────

async function geminiGenerateText(prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function geminiChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: systemPrompt
      ? [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood." }] },
          ...history,
        ]
      : history,
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

// ─── Public API ─────────────────────────────────────────────────────────────

function getProvider(): "groq" | "gemini" {
  const p = process.env.AI_PROVIDER?.toLowerCase();
  if (p === "gemini") return "gemini";
  return "groq"; // default
}

/**
 * Generate text from a single prompt string.
 * Use for: summarizer, quiz generator, parent report.
 */
export async function generateText(prompt: string): Promise<string> {
  if (getProvider() === "gemini") return geminiGenerateText(prompt);
  return groqGenerateText(prompt);
}

/**
 * Multi-turn chat completion.
 * Use for: chat assistant.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  systemPrompt?: string,
): Promise<string> {
  if (getProvider() === "gemini") return geminiChat(messages, systemPrompt);
  return groqChat(messages, systemPrompt);
}
