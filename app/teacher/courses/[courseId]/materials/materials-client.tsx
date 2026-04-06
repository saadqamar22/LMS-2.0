"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialUploadForm } from "@/components/material-upload-form";
import { deleteMaterial } from "@/app/actions/materials";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  courseId: string;
  deleteId?: string; // if provided, renders only a delete button
}

export function TeacherMaterialsClient({ courseId, deleteId }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (deleteId) {
    return (
      <button
        disabled={deleting}
        onClick={async () => {
          if (!confirm("Delete this material?")) return;
          setDeleting(true);
          await deleteMaterial(deleteId);
          router.refresh();
          setDeleting(false);
        }}
        className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <MaterialUploadForm
      courseId={courseId}
      onSuccess={() => router.refresh()}
    />
  );
}
