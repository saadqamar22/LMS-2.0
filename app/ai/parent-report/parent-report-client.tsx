"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Download, GraduationCap } from "lucide-react";
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

type MdProps = { children?: React.ReactNode };

const mdH2 = ({ children }: MdProps) => (
  <div className="mb-5 mt-10 first:mt-0">
    <div className="flex items-center gap-3">
      <div className="h-4 w-1 rounded-full bg-[#4F46E5]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4F46E5]">
        {children}
      </span>
    </div>
    <div className="mt-3 h-px bg-slate-100" />
  </div>
);

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

// `ordered` and `index` exist at runtime but are absent from react-markdown v10 types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdLi = (props: any) => {
  const ordered = props["ordered"] as boolean | undefined;
  const index = props["index"] as number | undefined;
  return (
    <li className="flex items-start gap-3">
      {ordered ? (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[11px] font-bold text-[#4F46E5]">
          {(index ?? 0) + 1}
        </span>
      ) : (
        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F46E5]" />
      )}
      <span className="text-[15px] leading-8 text-slate-600">{props.children}</span>
    </li>
  );
};

const mdStrong = ({ children }: MdProps) => (
  <strong className="font-semibold text-slate-800">{children}</strong>
);

const mdHr = () => <div className="my-8 h-px bg-slate-100" />;

const mdEm = ({ children }: MdProps) => (
  <em className="not-italic text-slate-400">{children}</em>
);

const markdownComponents = {
  h2: mdH2,
  h3: mdH3,
  p: mdP,
  ul: mdUl,
  ol: mdOl,
  li: mdLi,
  strong: mdStrong,
  hr: mdHr,
  em: mdEm,
};

export function ParentReportClient({ children }: Props) {
  const [selectedChild, setSelectedChild] = useState(children[0]?.student_id || "");
  const [report, setReport] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentInfo, setStudentInfo] = useState<{ class: string | null; section: string | null } | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generateReport() {
    if (!selectedChild) return;
    setError("");
    setReport("");
    setChartData(null);
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
              onClick={() => { setSelectedChild(child.student_id); setReport(""); setChartData(null); }}
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
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={copyReport}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
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
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-white px-4 py-3 border border-slate-100">
                <p className="text-xs text-slate-400">Attendance Rate</p>
                <p className={`mt-0.5 text-xl font-bold ${attendanceColor(chartData.summary.attendanceRate)}`}>
                  {chartData.summary.attendanceRate !== null ? `${chartData.summary.attendanceRate}%` : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-white px-4 py-3 border border-slate-100">
                <p className="text-xs text-slate-400">Courses Enrolled</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{chartData.summary.totalCourses}</p>
              </div>
              <div className="rounded-lg bg-white px-4 py-3 border border-slate-100">
                <p className="text-xs text-slate-400">Top Subject</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                  {chartData.summary.bestCourse || "N/A"}
                </p>
                {chartData.summary.bestCoursePct !== null && (
                  <p className="text-xs text-slate-400">{chartData.summary.bestCoursePct}%</p>
                )}
              </div>
              <div className="rounded-lg bg-white px-4 py-3 border border-slate-100">
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
                        contentStyle={{ borderRadius: "1rem", border: "1px solid #E2E8F0" }}
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
                      <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid #E2E8F0" }} />
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

          {/* Written Report */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50/60 px-8 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Detailed Assessment
              </p>
            </div>

            <div className="px-8 py-10">
              <ReactMarkdown components={markdownComponents}>{report}</ReactMarkdown>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-4">
              <p className="text-center text-xs text-slate-400">
                Generated {reportDate} · AI-Assisted Academic Progress Report
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
