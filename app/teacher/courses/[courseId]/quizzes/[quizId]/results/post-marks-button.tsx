"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postQuizMarksToSubject } from "@/app/actions/quizzes";
import { Loader2, BarChart3, CheckCircle2 } from "lucide-react";

interface Props {
  quizId: string;
  courseId: string;
  alreadyPosted: boolean;
}

export function PostMarksButton({ quizId, courseId, alreadyPosted }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [posted, setPosted] = useState(alreadyPosted);

  if (posted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        Marks posted to subject
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={loading}
        onClick={async () => {
          if (!confirm("This will create a new module for this quiz and post all scores to Marks. Continue?")) return;
          setError("");
          setLoading(true);
          const result = await postQuizMarksToSubject(quizId);
          setLoading(false);
          if (!result.success) {
            setError(result.error);
          } else {
            setPosted(true);
            router.refresh();
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
        Post Marks to Subject
      </button>
    </div>
  );
}
