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
    <div className="space-y-1.5">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Enrolling…" : "Enroll in Course"}
      </button>
    </div>
  );
}

