"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardList, Sparkles, CheckCircle2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { createQuiz, addQuestion } from "@/app/actions/quizzes";

interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
}

interface GeneratedQuestion {
  question_text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[] | null;
  correct_answer: string;
  marks: number;
}

interface Props {
  courses: Course[];
}

const DIFFICULTY = ["easy", "medium", "hard"];

export function QuizGeneratorClient({ courses }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"generate" | "review" | "done">("generate");
  const [saving, setSaving] = useState(false);

  // Form state
  const [courseId, setCourseId] = useState(courses[0]?.course_id || "");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [types, setTypes] = useState<string[]>(["mcq"]);
  const [quizTitle, setQuizTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");

  // Generated
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");
  const [savedQuizId, setSavedQuizId] = useState("");

  function toggleType(t: string) {
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function handleGenerate() {
    if (!topic.trim() || types.length === 0) return;
    setGenError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numQuestions, types, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || "Failed to generate."); }
      else {
        setQuestions(data.questions);
        setQuizTitle(quizTitle || `${topic} Quiz`);
        setStep("review");
      }
    } catch {
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestion(i: number, field: keyof GeneratedQuestion, value: any) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!courseId || questions.length === 0 || !quizTitle.trim()) return;
    setSaveError("");
    setSaving(true);

    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

    const quizResult = await createQuiz({
      courseId,
      title: quizTitle,
      totalMarks,
      timeLimitMins: timeLimit ? parseInt(timeLimit) : undefined,
    });

    if (!quizResult.success) {
      setSaveError(quizResult.error);
      setSaving(false);
      return;
    }

    const quizId = quizResult.quizId;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await addQuestion({
        quizId,
        questionText: q.question_text,
        type: q.type,
        options: q.options || undefined,
        correctAnswer: q.correct_answer,
        marks: q.marks,
        orderIndex: i,
      });
    }

    setSaving(false);
    setSavedQuizId(quizId);
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 shadow-[var(--shadow-card)] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Quiz created!</h2>
        <p className="mt-2 text-sm text-slate-500">
          {questions.length} questions saved. You can now review, edit, and publish it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push(`/teacher/courses/${courseId}/quizzes/${savedQuizId}`)}
            className="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            Manage Quiz
          </button>
          <button
            onClick={() => { setStep("generate"); setQuestions([]); setTopic(""); setQuizTitle(""); }}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Generate Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Generation Form */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#4F46E5]" />
          <h2 className="font-semibold text-slate-900">Generate Questions with AI</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, World War II, Quadratic Equations"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Number of Questions</label>
            <input
              type="number"
              min={1} max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTY.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition ${
                    difficulty === d ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Question Types</label>
            <div className="flex gap-2">
              {[
                { value: "mcq", label: "Multiple Choice" },
                { value: "true_false", label: "True / False" },
                { value: "short_answer", label: "Short Answer" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleType(t.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    types.includes(t.value) ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {genError && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{genError}</div>}

        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || types.length === 0 || generating}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] py-3 font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating…" : "Generate Questions"}
        </button>
      </div>

      {/* Step 2: Review & Save */}
      {step === "review" && questions.length > 0 && (
        <>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-semibold text-slate-900">Quiz Details</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Course *</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]"
                >
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>{c.course_code} — {c.course_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quiz Title *</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Time Limit (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="No limit"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{questions.length} Generated Questions</h2>
              <span className="text-sm text-slate-500">
                Total: {questions.reduce((s, q) => s + q.marks, 0)} marks
              </span>
            </div>

            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white shadow-[var(--shadow-card)]">
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-[#4F46E5]">{i + 1}</span>
                    <span className="truncate text-sm font-medium text-slate-900">{q.question_text}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.type === "mcq" ? "bg-blue-50 text-blue-700" :
                      q.type === "true_false" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"
                    }`}>{q.type}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-xs text-slate-400">{q.marks}m</span>
                    <button onClick={(e) => { e.stopPropagation(); removeQuestion(i); }} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expanded === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {expanded === i && (
                  <div className="border-t border-slate-100 px-5 pb-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500">Question Text</label>
                      <textarea
                        rows={2}
                        value={q.question_text}
                        onChange={(e) => updateQuestion(i, "question_text", e.target.value)}
                        className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4F46E5]"
                      />
                    </div>

                    {q.type === "mcq" && q.options && (
                      <div>
                        <label className="text-xs font-medium text-slate-500">Options</label>
                        {q.options.map((opt, oi) => (
                          <input
                            key={oi}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[oi] = e.target.value;
                              updateQuestion(i, "options", newOpts);
                            }}
                            className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4F46E5]"
                          />
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500">Correct Answer</label>
                        <input
                          type="text"
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(i, "correct_answer", e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4F46E5]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Marks</label>
                        <input
                          type="number"
                          min={1} max={10}
                          value={q.marks}
                          onChange={(e) => updateQuestion(i, "marks", parseInt(e.target.value) || 1)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4F46E5]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {saveError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>}

          <button
            onClick={handleSave}
            disabled={saving || questions.length === 0 || !courseId || !quizTitle.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
            {saving ? "Saving quiz…" : `Save Quiz (${questions.length} questions)`}
          </button>
        </>
      )}
    </div>
  );
}
