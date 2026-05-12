"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/messages";
import type { Message, ConversationParticipant } from "@/app/actions/messages";

interface MessageThreadProps {
  conversationId: string;
  initialMessages: Message[];
  participants: ConversationParticipant[];
  currentUserId: string;
  currentUserRole: string;
}

const ROLE_BUBBLE: Record<string, string> = {
  teacher: "bg-violet-600",
  student: "bg-blue-600",
  parent: "bg-emerald-600",
  admin: "bg-indigo-600",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function MessageThread({
  conversationId,
  initialMessages,
  participants,
  currentUserId,
  currentUserRole,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const raw = payload.new as {
            message_id: string;
            conversation_id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          // Skip if we sent it (already added optimistically)
          if (raw.sender_id === currentUserId) return;

          const sender = participants.find((p) => p.user_id === raw.sender_id);
          const newMsg: Message = {
            message_id: raw.message_id,
            conversation_id: raw.conversation_id,
            sender_id: raw.sender_id,
            sender_name: sender?.full_name ?? "Unknown",
            sender_role: sender?.role ?? "student",
            body: raw.body,
            created_at: raw.created_at,
          };
          setMessages((prev) => {
            // Deduplicate by message_id
            if (prev.some((m) => m.message_id === raw.message_id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, participants]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    // Optimistic update
    const optimistic: Message = {
      message_id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_name: "You",
      sender_role: currentUserRole,
      body: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const result = await sendMessage(conversationId, trimmed);
    if (!result.success) {
      setError(result.error ?? "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.message_id !== optimistic.message_id));
      setInput(trimmed);
    } else if (result.message) {
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.message_id === optimistic.message_id ? result.message! : m))
      );
    }

    setSending(false);
    textareaRef.current?.focus();
  }, [input, sending, conversationId, currentUserId, currentUserRole]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-12">
            No messages yet. Start the conversation.
          </p>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          const bubbleColor = ROLE_BUBBLE[msg.sender_role] ?? "bg-slate-600";

          return (
            <div
              key={msg.message_id}
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              {!isMine && (
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${bubbleColor}`}
                >
                  {getInitials(msg.sender_name)}
                </div>
              )}

              <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMine && (
                  <span className="text-[11px] font-medium text-slate-400 px-1">
                    {msg.sender_name}
                  </span>
                )}
                <div
                  className={`rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                  style={isMine ? { backgroundColor: "var(--role-primary)" } : {}}
                >
                  {msg.body}
                </div>
                <span className="text-[11px] text-slate-300 px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 rounded-lg p-1.5 text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--role-primary)" }}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-300">Shift+Enter for new line</p>
      </div>
    </div>
  );
}
