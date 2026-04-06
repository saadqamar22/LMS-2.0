"use client";

import { useRouter } from "next/navigation";
import { SubmitAssignmentForm } from "@/components/submit-assignment-form";
import type { Submission } from "@/app/actions/submissions";

interface SubmitFormClientProps {
  assignmentId: string;
  courseId: string;
  existingSubmission: Submission | null;
}

export function SubmitFormClient({
  assignmentId,
  courseId,
  existingSubmission,
}: SubmitFormClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <SubmitAssignmentForm
      assignmentId={assignmentId}
      courseId={courseId}
      existingSubmission={existingSubmission}
      onSuccess={handleSuccess}
    />
  );
}

