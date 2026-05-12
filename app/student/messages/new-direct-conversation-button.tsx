"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, X, Search } from "lucide-react";
import { createConversation } from "@/app/actions/messages";
import type { Recipient } from "@/app/actions/messages";

interface Props {
  recipients: Recipient[];
  role: "student" | "parent";
}

export function NewDirectConversationButton({ recipients, role }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setOpen(false);
    setSearch("");
    setError(null);
  }

  function startWith(recipient: Recipient) {
    setError(null);
    startTransition(async () => {
      const result = await createConversation([recipient.user_id]);
      if (result.success && result.conversationId) {
        handleClose();
        router.push(`/${role}/messages/${result.conversationId}`);
      } else {
        setError(result.error ?? "Failed to create conversation");
      }
    });
  }

  const filtered = recipients.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.course_name.toLowerCase().includes(search.toLowerCase())
  );

  const seen = new Set<string>();
  const unique = filtered.filter((r) => {
    if (seen.has(r.user_id)) return false;
    seen.add(r.user_id);
    return true;
  });

  if (recipients.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--role-primary)" }}
      >
        <MessageSquarePlus className="h-4 w-4" />
        New conversation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">Message a teacher</h3>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teacher or course…"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {unique.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No teachers found</p>
                ) : (
                  unique.map((r) => (
                    <button
                      key={r.user_id}
                      onClick={() => startWith(r)}
                      disabled={isPending}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{r.full_name}</p>
                      <p className="text-xs text-slate-400">{r.course_name}</p>
                    </button>
                  ))
                )}
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
