"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addQuestion, deleteQuestion, setQuizPublished } from "@/app/actions/quizzes";
import { Trash2, Loader2, Eye, EyeOff } from "lucide-react";

type Mode = "add-question" | "delete-question" | "publish-toggle";

interface Props {
  quizId: string;
  courseId: string;
  isPublished: boolean;
  mode: Mode;
  questionId?: string;
}

export function QuizManageClient({ quizId, courseId, isPublished, mode, questionId }: Props) {
  const router = useRouter();

  if (mode === "delete-question") {
    return <DeleteQuestionButton questionId={questionId!} onDone={() => router.refresh()} />;
  }

  if (mode === "publish-toggle") {
    return (
      <PublishToggle
        quizId={quizId}
        isPublished={isPublished}
        onDone={() => router.refresh()}
      />
    );
  }

  return <AddQuestionForm quizId={quizId} courseId={courseId} onDone={() => router.refresh()} />;
}

// ─── Delete button ──────────────────────────────────────────────────────────

function DeleteQuestionButton({ questionId, onDone }: { questionId: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        if (!confirm("Delete this question?")) return;
        setLoading(true);
        await deleteQuestion(questionId);
        onDone();
        setLoading(false);
      }}
      className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

// ─── Publish toggle ─────────────────────────────────────────────────────────

function PublishToggle({ quizId, isPublished, onDone }: { quizId: string; isPublished: boolean; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={loading}
        onClick={async () => {
          setError("");
          setLoading(true);
          const result = await setQuizPublished(quizId, !isPublished);
          setLoading(false);
          if (!result.success) setError(result.error);
          else onDone();
        }}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
          isPublished
            ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPublished ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {isPublished ? "Unpublish" : "Publish Quiz"}
      </button>
    </div>
  );
}

// ─── Add question form ──────────────────────────────────────────────────────

type QuestionType = "mcq" | "true_false" | "short_answer";

function AddQuestionForm({ quizId, courseId, onDone }: { quizId: string; courseId: string; onDone: () => void }) {
  const [type, setType] = useState<QuestionType>("mcq");
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!text.trim()) { setError("Question text is required."); return; }
    if (!correctAnswer.trim()) { setError("Correct answer is required."); return; }
    if (type === "mcq") {
      const filled = options.filter((o) => o.trim());
      if (filled.length < 2) { setError("Add at least 2 options."); return; }
      if (!options.includes(correctAnswer)) { setError("Correct answer must match one of the options exactly."); return; }
    }

    setLoading(true);
    const result = await addQuestion({
      quizId,
      questionText: text,
      type,
      options: type === "mcq" ? options.filter((o) => o.trim()) : undefined,
      correctAnswer,
      marks,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setText("");
      setMarks(1);
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value as QuestionType); setCorrectAnswer(""); }}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
        >
          <option value="mcq">Multiple Choice</option>
          <option value="true_false">True / False</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Question *</label>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          placeholder="Enter your question here"
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Marks</label>
        <input
          type="number"
          min={1}
          value={marks}
          onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
        />
      </div>

      {type === "mcq" && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">Options</label>
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
            />
          ))}
          <label className="block text-xs font-medium text-slate-600">Correct Answer</label>
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
          >
            <option value="">Select correct option</option>
            {options.filter((o) => o.trim()).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      {type === "true_false" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Correct Answer</label>
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
          >
            <option value="">Select answer</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      )}

      {type === "short_answer" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Expected Answer</label>
          <input
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="The expected answer"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">Short answers are not auto-graded. Students see their response after submission.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Adding…" : "Add Question"}
      </button>
    </form>
  );
}
