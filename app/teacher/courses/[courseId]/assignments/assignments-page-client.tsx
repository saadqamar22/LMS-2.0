"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/assignment-form";
import { AssignmentList } from "./assignment-list";
import { EmptyState } from "@/components/empty-state";
import { Plus } from "lucide-react";
import type { Assignment } from "@/app/actions/assignments";

interface AssignmentsPageClientProps {
  courseId: string;
  assignments: Assignment[];
  showCreateForm: boolean;
}

export function AssignmentsPageClient({
  courseId,
  assignments,
  showCreateForm: initialShowCreateForm,
}: AssignmentsPageClientProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(initialShowCreateForm);

  const handleSuccess = () => {
    setShowCreateForm(false);
    router.refresh();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    router.push(`/teacher/courses/${courseId}/assignments`);
  };

  if (showCreateForm) {
    return (
      <AssignmentForm
        courseId={courseId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setShowCreateForm(true);
            router.push(`/teacher/courses/${courseId}/assignments?create=true`);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#4338CA]"
        >
          <Plus className="h-4 w-4" />
          Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Create your first assignment to get started."
        />
      ) : (
        <AssignmentList assignments={assignments} courseId={courseId} />
      )}
    </>
  );
}

