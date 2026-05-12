"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteConversation } from "@/app/actions/messages";

interface Props {
  conversationId: string;
  role: "student" | "teacher" | "parent";
}

export function DeleteConversationButton({ conversationId, role }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm) {
      setConfirm(true);
      return;
    }
    startTransition(async () => {
      await deleteConversation(conversationId);
      router.refresh();
    });
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirm(false);
  }

  if (confirm) {
    return (
      <div
        className="flex items-center gap-1"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
      title="Delete conversation"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
