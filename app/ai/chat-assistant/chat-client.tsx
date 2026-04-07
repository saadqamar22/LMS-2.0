"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  role: string;
}

export function ChatClient({ role }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your ILMS AI assistant. Ask me anything about your courses, assignments, concepts, or academic topics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || data.error || "Something went wrong." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Failed to connect to AI. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">ILMS Assistant</p>
            <p className="text-xs text-slate-400">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([{ role: "assistant", content: "Hi! I'm your ILMS AI assistant. Ask me anything about your courses, assignments, concepts, or academic topics." }])}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              msg.role === "assistant" ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-slate-900 text-white"
            }`}>
              {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-[#4F46E5] text-white rounded-tr-sm"
                : "bg-slate-50 text-slate-900 rounded-tl-sm"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-li:text-slate-800 prose-strong:text-slate-900">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-[#4F46E5]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 max-h-32"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5] text-white disabled:opacity-40 hover:bg-[#4338CA]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-slate-400">AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
}
