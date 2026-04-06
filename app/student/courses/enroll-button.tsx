"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollInCourse } from "@/app/actions/enrollments";

interface EnrollButtonProps {
  courseId: string;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);

    const result = await enrollInCourse(courseId);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Refresh the page to show updated enrollment status
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <p className="text-xs text-red-600 max-w-[200px] text-right">
          {error}
        </p>
      )}
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Enrolling..." : "Enroll"}
      </button>
    </div>
  );
}

