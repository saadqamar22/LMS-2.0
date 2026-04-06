"use client";

import { useRouter } from "next/navigation";
import { SubmissionTable } from "@/components/submission-table";
import type { Submission } from "@/app/actions/submissions";

interface SubmissionsClientProps {
  submissions: Submission[];
  assignmentId?: string;
}

export function SubmissionsClient({
  submissions,
}: SubmissionsClientProps) {
  const router = useRouter();

  const handleGradeUpdate = () => {
    router.refresh();
  };

  return (
    <SubmissionTable
      submissions={submissions}
      onGradeUpdate={handleGradeUpdate}
    />
  );
}

