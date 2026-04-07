"use client";

import { useState } from "react";
import { Loader2, FileText, Copy, Check, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODES = [
  { value: "concise", label: "Concise", desc: "3-5 bullet points" },
  { value: "detailed", label: "Detailed", desc: "Full structured summary" },
  { value: "key-points", label: "Key Points", desc: "Numbered important facts" },
  { value: "study-notes", label: "Study Notes", desc: "Revision-ready notes" },
];

export function SummarizerClient() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("concise");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSummarize() {
    if (!text.trim()) return;
    setError("");
    setSummary("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/summarizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to summarize."); }
      else { setSummary(data.summary); }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Panel */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 font-semibold text-slate-900">Paste Content</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Paste your lecture notes, article, textbook passage, or any content you want summarized…"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#4F46E5] placeholder:text-slate-400"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{wordCount} words · {charCount}/50,000 chars</span>
            {text && (
              <button onClick={() => setText("")} className="flex items-center gap-1 hover:text-slate-600">
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Mode selector */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 font-semibold text-slate-900">Summary Style</h2>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  mode === m.value
                    ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs opacity-70">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSummarize}
          disabled={!text.trim() || loading || charCount > 50000}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] px-4 py-3 font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {loading ? "Summarizing…" : "Summarize"}
        </button>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Output Panel */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Summary</h2>
          {summary && (
            <button
              onClick={copySummary}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                copied ? "bg-green-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        {summary ? (
          <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4F46E5]" />
              <p className="mt-3 text-sm text-slate-400">Analyzing content…</p>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-center">
            <div>
              <FileText className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-3 text-sm text-slate-400">Your summary will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
