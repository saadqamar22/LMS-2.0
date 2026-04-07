"use client";

import { useState } from "react";
import {
  FileText, Video, Link as LinkIcon, Image, File, ExternalLink,
  Sparkles, BookOpen, StickyNote, List, X, Loader2, Copy, Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const TYPE_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  video: Video,
  link: LinkIcon,
  image: Image,
  other: File,
};

const TYPE_COLOR: Record<string, string> = {
  pdf: "bg-red-50 text-red-600",
  video: "bg-blue-50 text-blue-600",
  link: "bg-green-50 text-green-600",
  image: "bg-yellow-50 text-yellow-600",
  other: "bg-slate-50 text-slate-600",
};

interface Material {
  material_id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: string;
  file_url: string | null;
  external_url: string | null;
  created_at: string | null;
}

interface AIResult {
  tool: "quiz" | "notes" | "summary";
  content: string; // markdown for notes/summary; JSON string for quiz
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  question_text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[] | null;
  correct_answer: string;
  marks: number;
}

export function MaterialCardWithAI({ material }: { material: Material }) {
  const Icon = TYPE_ICON[material.type] || File;
  const colorClass = TYPE_COLOR[material.type] || TYPE_COLOR.other;
  const href =
    material.type === "link" ? material.external_url || "#" : material.file_url || "#";

  const hasAI = material.type !== "link";

  const [loading, setLoading] = useState<"quiz" | "notes" | "summary" | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Quiz interaction state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  async function runTool(tool: "quiz" | "notes" | "summary") {
    setLoading(tool);
    setError("");
    setResult(null);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetch("/api/ai/material-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          materialId: material.material_id,
          numQuestions: 5,
          types: ["mcq", "true_false"],
          difficulty: "medium",
          mode: "concise",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else if (tool === "quiz") {
        setResult({ tool, content: "", questions: data.questions });
      } else if (tool === "notes") {
        setResult({ tool, content: data.notes });
      } else {
        setResult({ tool, content: data.summary });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getScore() {
    if (!result?.questions) return null;
    let correct = 0;
    result.questions.forEach((q, i) => {
      if (quizAnswers[i]?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
        correct++;
      }
    });
    return correct;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]">
      {/* Material header */}
      <div className="flex items-start justify-between gap-2">
        <div className={`rounded-xl p-2.5 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-500">
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      </div>
      <div>
        <p className="font-semibold text-slate-900 line-clamp-2">{material.title}</p>
        {material.description && (
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{material.description}</p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          {material.type}
        </span>
        <span className="text-xs text-slate-400">
          {material.created_at ? new Date(material.created_at).toLocaleDateString() : ""}
        </span>
      </div>

      {/* AI action buttons */}
      {hasAI && (
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => runTool("quiz")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#EEF2FF] px-3 py-1.5 text-xs font-medium text-[#4F46E5] hover:bg-indigo-100 disabled:opacity-50 transition"
          >
            {loading === "quiz" ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
            Practice Quiz
          </button>
          <button
            onClick={() => runTool("notes")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition"
          >
            {loading === "notes" ? <Loader2 className="h-3 w-3 animate-spin" /> : <StickyNote className="h-3 w-3" />}
            Study Notes
          </button>
          <button
            onClick={() => runTool("summary")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
          >
            {loading === "summary" ? <Loader2 className="h-3 w-3 animate-spin" /> : <List className="h-3 w-3" />}
            Summarize
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#4F46E5]" />
          <Sparkles className="h-3.5 w-3.5 text-[#4F46E5]" />
          Generating with AI…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* AI result panel */}
      {result && (
        <div className="mt-1 rounded-2xl border border-slate-100 bg-slate-50">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#4F46E5]" />
              <span className="text-sm font-semibold text-slate-800">
                {result.tool === "quiz"
                  ? "Practice Quiz"
                  : result.tool === "notes"
                  ? "Study Notes"
                  : "Summary"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {result.tool !== "quiz" && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
              <button
                onClick={() => setResult(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Panel content */}
          <div className="p-4">
            {result.tool === "quiz" && result.questions ? (
              <QuizPanel
                questions={result.questions}
                index={quizIndex}
                setIndex={setQuizIndex}
                answers={quizAnswers}
                setAnswers={setQuizAnswers}
                submitted={quizSubmitted}
                setSubmitted={setQuizSubmitted}
                getScore={getScore}
              />
            ) : (
              <div className="prose prose-sm max-w-none text-slate-700">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface QuizPanelProps {
  questions: QuizQuestion[];
  index: number;
  setIndex: (i: number) => void;
  answers: Record<number, string>;
  setAnswers: (a: Record<number, string>) => void;
  submitted: boolean;
  setSubmitted: (s: boolean) => void;
  getScore: () => number | null;
}

function QuizPanel({
  questions, index, setIndex, answers, setAnswers, submitted, setSubmitted, getScore,
}: QuizPanelProps) {
  const q = questions[index];
  const totalQ = questions.length;

  if (submitted) {
    const score = getScore() ?? 0;
    const pct = Math.round((score / totalQ) * 100);
    return (
      <div className="space-y-4">
        <div className={`rounded-xl p-4 text-center ${pct >= 70 ? "bg-green-50" : pct >= 50 ? "bg-amber-50" : "bg-red-50"}`}>
          <p className={`text-2xl font-bold ${pct >= 70 ? "text-green-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>
            {score}/{totalQ}
          </p>
          <p className="text-sm text-slate-600 mt-1">{pct}% — {pct >= 70 ? "Great job!" : pct >= 50 ? "Keep practicing!" : "Review the material and try again."}</p>
        </div>
        <div className="space-y-2">
          {questions.map((question, i) => {
            const userAns = answers[i] || "";
            const isCorrect = userAns.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
            return (
              <div key={i} className={`rounded-xl border p-3 text-sm ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <p className="font-medium text-slate-800">{i + 1}. {question.question_text}</p>
                <p className={`mt-1 ${isCorrect ? "text-green-700" : "text-red-600"}`}>
                  Your answer: {userAns || "(no answer)"}
                </p>
                {!isCorrect && (
                  <p className="text-green-700">Correct: {question.correct_answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Question {index + 1} of {totalQ}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          q.type === "mcq" ? "bg-blue-50 text-blue-700" :
          q.type === "true_false" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"
        }`}>{q.type}</span>
      </div>

      <p className="text-sm font-medium text-slate-800">{q.question_text}</p>

      {q.type === "mcq" && q.options ? (
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              type="button"
              onClick={() => setAnswers({ ...answers, [index]: opt })}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                answers[index] === opt
                  ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : q.type === "true_false" ? (
        <div className="flex gap-3">
          {["True", "False"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAnswers({ ...answers, [index]: opt })}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition ${
                answers[index] === opt
                  ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={answers[index] || ""}
          onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
          placeholder="Type your answer…"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]"
        />
      )}

      <div className="flex gap-2 pt-1">
        {index > 0 && (
          <button
            onClick={() => setIndex(index - 1)}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        )}
        {index < totalQ - 1 ? (
          <button
            onClick={() => setIndex(index + 1)}
            disabled={!answers[index]}
            className="flex-1 rounded-xl bg-[#4F46E5] py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!answers[index]}
            className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
