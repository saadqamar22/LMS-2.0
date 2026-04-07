"use client";

import { useState } from "react";
import { Loader2, FileText, Copy, Check, Download, GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Child {
  student_id: string;
  full_name: string;
  class: string | null;
  section: string | null;
}

interface Props {
  children: Child[];
}

export function ParentReportClient({ children }: Props) {
  const [selectedChild, setSelectedChild] = useState(children[0]?.student_id || "");
  const [report, setReport] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generateReport() {
    if (!selectedChild) return;
    setError("");
    setReport("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/parent-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedChild }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to generate report."); }
      else {
        setReport(data.report);
        setStudentName(data.studentName);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadReport() {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName}_progress_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedChildInfo = children.find((c) => c.student_id === selectedChild);

  return (
    <div className="space-y-6">
      {/* Child selector */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 font-semibold text-slate-900">Select Child</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <button
              key={child.student_id}
              onClick={() => { setSelectedChild(child.student_id); setReport(""); }}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                selectedChild === child.student_id
                  ? "border-[#4F46E5] bg-[#EEF2FF]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                selectedChild === child.student_id ? "bg-[#4F46E5] text-white" : "bg-slate-200 text-slate-600"
              }`}>
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
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] py-3 font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
          {loading
            ? "Generating report…"
            : `Generate Report for ${selectedChildInfo?.full_name || "Selected Child"}`}
        </button>

        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      {/* Report Output */}
      {(report || loading) && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Progress Report</h2>
              {studentName && <p className="text-sm text-slate-400">{studentName}</p>}
            </div>
            {report && (
              <div className="flex gap-2">
                <button
                  onClick={copyReport}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    copied ? "bg-green-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4F46E5]" />
                <p className="mt-3 text-sm text-slate-400">Analyzing academic data…</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
