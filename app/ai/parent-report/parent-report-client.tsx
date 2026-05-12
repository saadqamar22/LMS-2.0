"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Copy, Check, Download, GraduationCap, Play, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

interface Child {
  student_id: string;
  full_name: string;
  class: string | null;
  section: string | null;
}

interface ChartData {
  coursePerformance: { course: string; courseName: string; pct: number }[];
  attendance: { month: string; present: number; absent: number; late: number }[];
  summary: {
    attendanceRate: number | null;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    totalCourses: number;
    bestCourse: string | null;
    bestCoursePct: number | null;
  };
}

interface Props {
  children: Child[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 75) return "#22C55E";
  if (pct >= 60) return "#4F46E5";
  if (pct >= 45) return "#F59E0B";
  return "#F87171";
}

function attendanceColor(rate: number | null) {
  if (rate === null) return "text-slate-400";
  if (rate >= 80) return "text-green-600";
  if (rate >= 60) return "text-amber-600";
  return "text-red-500";
}

function splitSections(markdown: string): { title: string; content: string }[] {
  const lines = markdown.split("\n");
  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^## /, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return sections
    .map((s) => ({ title: s.title, content: s.lines.join("\n").trim() }))
    .filter((s) => s.title || s.content);
}

function toPlainText(title: string, content: string): string {
  return [title, content]
    .filter(Boolean)
    .join(". ")
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1")
    .replace(/\*([\s\S]*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Split text into ≤180-char chunks at sentence/word boundaries for Google TTS
function chunkText(text: string, maxLen = 180): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > maxLen) {
    const slice = remaining.slice(0, maxLen);
    // Prefer sentence-ending boundaries (includes Urdu ۔ and ، )
    const sentenceEnd = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("۔ "),
      slice.lastIndexOf("، "),
    );
    const splitAt = sentenceEnd > 40 ? sentenceEnd + 1 : slice.lastIndexOf(" ");
    const cut = splitAt > 0 ? splitAt : maxLen;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks.filter((c) => c.length > 0);
}

// ── Markdown components (for section bodies — no h2 needed) ──────────────────

type MdProps = { children?: React.ReactNode };

const mdH3 = ({ children }: MdProps) => (
  <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-800">{children}</h3>
);
const mdP = ({ children }: MdProps) => (
  <p className="mb-4 text-[15px] leading-8 text-slate-600">{children}</p>
);
const mdUl = ({ children }: MdProps) => (
  <ul className="mb-5 space-y-2.5">{children}</ul>
);
const mdOl = ({ children }: MdProps) => (
  <ol className="mb-5 space-y-2.5">{children}</ol>
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdLi = (props: any) => {
  const ordered = props["ordered"] as boolean | undefined;
  const index = props["index"] as number | undefined;
  return (
    <li className="flex items-start gap-3">
      {ordered ? (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
          {(index ?? 0) + 1}
        </span>
      ) : (
        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
      )}
      <span className="text-[15px] leading-8 text-slate-600">{props.children}</span>
    </li>
  );
};
const mdStrong = ({ children }: MdProps) => (
  <strong className="font-semibold text-slate-800">{children}</strong>
);
const mdHr = () => <div className="my-6 h-px bg-slate-100" />;
const mdEm = ({ children }: MdProps) => (
  <em className="not-italic text-slate-400">{children}</em>
);

const markdownComponents = {
  h3: mdH3,
  p: mdP,
  ul: mdUl,
  ol: mdOl,
  li: mdLi,
  strong: mdStrong,
  hr: mdHr,
  em: mdEm,
};

// ── Main component ────────────────────────────────────────────────────────────

export function ParentReportClient({ children }: Props) {
  const [selectedChild, setSelectedChild] = useState(children[0]?.student_id || "");
  const [report, setReport] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentInfo, setStudentInfo] = useState<{ class: string | null; section: string | null } | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Translation
  const [language, setLanguage] = useState<"en" | "ur">("en");
  const [translatedReport, setTranslatedReport] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  // TTS
  const [playingSection, setPlayingSection] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopRequestedRef = useRef(false);

  // Stop all audio on unmount
  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      currentAudioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const activeReport = language === "ur" && translatedReport ? translatedReport : report;
  const sections = activeReport ? splitSections(activeReport) : [];

  async function generateReport() {
    if (!selectedChild) return;
    setError("");
    setReport("");
    setChartData(null);
    setTranslatedReport("");
    setLanguage("en");
    stopTTS();
    setLoading(true);
    try {
      const res = await fetch("/api/ai/parent-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedChild }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate report.");
      } else {
        setReport(data.report);
        setStudentName(data.studentName);
        setStudentInfo(data.studentInfo);
        setChartData(data.chartData);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate() {
    // Toggle back to English instantly (cached)
    if (language === "ur") {
      stopTTS();
      setLanguage("en");
      return;
    }
    // Switch to Urdu — use cache if available
    if (translatedReport) {
      stopTTS();
      setLanguage("ur");
      return;
    }
    // Fetch translation
    setTranslating(true);
    setTranslateError("");
    stopTTS();
    try {
      const res = await fetch("/api/ai/translate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: report, targetLang: "ur" }),
      });
      const data = await res.json();
      if (res.ok) {
        setTranslatedReport(data.translatedText);
        setLanguage("ur");
      } else {
        setTranslateError(data.error || "Translation failed.");
      }
    } catch {
      setTranslateError("Translation failed. Please try again.");
    } finally {
      setTranslating(false);
    }
  }

  function stopTTS() {
    stopRequestedRef.current = true;
    currentAudioRef.current?.pause();
    currentAudioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingSection(null);
    setTtsLoading(false);
  }

  async function handlePlaySection(index: number, title: string, content: string) {
    // Stop if already playing this section
    if (playingSection === index || ttsLoading) {
      stopTTS();
      return;
    }

    stopTTS();
    const text = toPlainText(title, content);

    // ── English: use browser speech synthesis ───────────────────────────────
    if (language === "en") {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.92;
      const match = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
      if (match) utterance.voice = match;
      utterance.onend = () => setPlayingSection(null);
      utterance.onerror = () => setPlayingSection(null);
      setPlayingSection(index);
      window.speechSynthesis.speak(utterance);
      return;
    }

    // ── Urdu: use Google Translate TTS via proxy ────────────────────────────
    const chunks = chunkText(text);
    if (!chunks.length) return;

    stopRequestedRef.current = false;
    setTtsLoading(true);
    setPlayingSection(index);

    for (const chunk of chunks) {
      if (stopRequestedRef.current) break;

      await new Promise<void>((resolve) => {
        const audio = new Audio(
          `/api/tts?text=${encodeURIComponent(chunk)}&lang=ur`
        );
        currentAudioRef.current = audio;
        audio.oncanplaythrough = () => {
          if (stopRequestedRef.current) { resolve(); return; }
          setTtsLoading(false);
          audio.play().catch(resolve);
        };
        audio.onended = () => resolve();
        audio.onerror = () => resolve(); // skip bad chunk, keep going
        audio.load();
      });
    }

    if (!stopRequestedRef.current) {
      setPlayingSection(null);
      setTtsLoading(false);
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(activeReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadReport() {
    const langSuffix = language === "ur" ? "_urdu" : "";
    const blob = new Blob([activeReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName}_progress_report${langSuffix}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedChildInfo = children.find((c) => c.student_id === selectedChild);
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Select Child</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <button
              key={child.student_id}
              onClick={() => {
                setSelectedChild(child.student_id);
                setReport("");
                setChartData(null);
                setTranslatedReport("");
                setLanguage("en");
                stopTTS();
              }}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                selectedChild === child.student_id
                  ? "border-slate-400 bg-slate-100"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: selectedChild === child.student_id ? "var(--role-primary)" : "#94A3B8" }}
              >
                {child.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{child.full_name}</p>
                <p className="text-xs text-slate-400">
                  {child.class && child.section ? `${child.class} — ${child.section}` : "No class info"}
                </p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={generateReport}
          disabled={!selectedChild || loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--role-primary)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
          {loading
            ? "Generating report…"
            : `Generate Report for ${selectedChildInfo?.full_name || "Selected Child"}`}
        </button>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--role-primary)" }} />
            <p className="text-sm font-medium text-slate-500">Analysing academic data…</p>
            <p className="text-xs text-slate-400">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Report */}
      {report && chartData && !loading && (
        <>
          {/* Report Header */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Academic Progress Report
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{studentName}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {studentInfo?.class && studentInfo?.section
                    ? `Class ${studentInfo.class} — Section ${studentInfo.section} · `
                    : ""}
                  Generated {reportDate}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={copyReport}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    copied
                      ? "bg-green-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">Attendance Rate</p>
                <p className={`mt-0.5 text-xl font-bold ${attendanceColor(chartData.summary.attendanceRate)}`}>
                  {chartData.summary.attendanceRate !== null ? `${chartData.summary.attendanceRate}%` : "N/A"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">Courses Enrolled</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{chartData.summary.totalCourses}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">Top Subject</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                  {chartData.summary.bestCourse || "N/A"}
                </p>
                {chartData.summary.bestCoursePct !== null && (
                  <p className="text-xs text-slate-400">{chartData.summary.bestCoursePct}%</p>
                )}
              </div>
              <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">Sessions Tracked</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{chartData.summary.totalRecords}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {chartData.coursePerformance.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Academics</p>
                <h3 className="mt-0.5 text-lg font-semibold text-slate-900">Course Performance</h3>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.coursePerformance} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="course" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 12 }} unit="%" />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Score"]}
                        labelFormatter={(label) =>
                          chartData.coursePerformance.find((c) => c.course === label)?.courseName || label
                        }
                        contentStyle={{ borderRadius: "0.5rem", border: "1px solid #E2E8F0" }}
                      />
                      <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                        {chartData.coursePerformance.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={scoreColor(entry.pct)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />≥ 75%</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4F46E5]" />60–74%</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />45–59%</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Below 45%</span>
                </div>
              </div>
            )}

            {chartData.attendance.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attendance</p>
                <h3 className="mt-0.5 text-lg font-semibold text-slate-900">Monthly Breakdown</h3>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.attendance} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid #E2E8F0" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="present" name="Present" stackId="a" fill="#22C55E" />
                      <Bar dataKey="late" name="Late" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="absent" name="Absent" stackId="a" fill="#F87171" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />{chartData.summary.presentCount} Present
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />{chartData.summary.lateCount} Late
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-400" />{chartData.summary.absentCount} Absent
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Written Report — section by section */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Detailed Assessment
              </p>

              {/* Language toggle */}
              <div className="flex items-center gap-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => {
                    if (language === "ur") {
                      window.speechSynthesis?.cancel();
                      setPlayingSection(null);
                      setLanguage("en");
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    language === "en"
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={handleTranslate}
                  disabled={translating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition ${
                    language === "ur"
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  } disabled:opacity-50`}
                >
                  {translating && <Loader2 className="h-3 w-3 animate-spin" />}
                  اردو
                </button>
              </div>
            </div>

            {translating && (
              <div className="flex items-center gap-2 border-b border-slate-100 bg-amber-50 px-6 py-2.5 text-xs text-amber-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Translating to Urdu… this may take a moment.
              </div>
            )}

            {translateError && (
              <div className="border-b border-slate-100 bg-red-50 px-6 py-2.5 text-xs text-red-700">
                {translateError}
              </div>
            )}

            {/* Sections */}
            <div dir={language === "ur" ? "rtl" : "ltr"} className="divide-y divide-slate-50">
              {sections.length === 0 ? (
                <div className="px-8 py-10">
                  <ReactMarkdown components={markdownComponents}>{activeReport}</ReactMarkdown>
                </div>
              ) : (
                sections.map((section, i) => {
                  const isPlaying = playingSection === i;
                  return (
                    <div key={i} className={`px-8 py-8 transition-colors ${isPlaying ? "bg-emerald-50/40" : ""}`}>
                      {/* Section header row */}
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-4 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: "var(--role-primary)" }}
                          />
                          <span
                            className="text-[11px] font-bold uppercase tracking-[0.15em] truncate"
                            style={{ color: "var(--role-primary)" }}
                          >
                            {section.title}
                          </span>
                        </div>

                        <button
                          onClick={() => handlePlaySection(i, section.title, section.content)}
                          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            isPlaying
                              ? "bg-emerald-100 text-emerald-700"
                              : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {isPlaying && ttsLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Loading…
                            </>
                          ) : isPlaying ? (
                            <>
                              <Square className="h-3 w-3 fill-current" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 fill-current" />
                              Listen
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mb-5 h-px bg-slate-100" />

                      <ReactMarkdown components={markdownComponents}>
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-4">
              <p className="text-center text-xs text-slate-400">
                Generated {reportDate} · AI-Assisted Academic Progress Report
                {language === "ur" && " · اردو ترجمہ"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
