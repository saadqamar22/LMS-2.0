"use client";

import { Bot, Send } from "lucide-react";
import { useState } from "react";

export function ChatbotWidget() {
  const [messages, setMessages] = useState<
    { id: number; author: string; content: string }[]
  >([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, author: "You", content: input },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#EEF2FF] p-3 text-[#4F46E5]">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            AI Mentor Beta
          </p>
          <p className="text-xs text-slate-500">Always-on learning assistant</p>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
            Conversations you start in the full AI assistant will appear here.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">
                {message.author}
              </p>
              <p className="text-sm text-slate-700">{message.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 border-none bg-transparent py-3 text-sm text-slate-600 outline-none"
        />
        <button
          onClick={handleSend}
          className="rounded-2xl bg-[#4F46E5] p-2 text-white"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </button>
      </div>
    </div>
  );
}

