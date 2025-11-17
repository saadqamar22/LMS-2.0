import { DashboardShell } from "@/components/dashboard-shell";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { FormInput } from "@/components/form-input";

export default function AIChatAssistantPage() {
  return (
    <DashboardShell role="student">
      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-slate-400">AI Mentor</p>
          <h1 className="text-2xl font-semibold text-slate-900">Chat assistant</h1>
          <div className="mt-6 space-y-4">
            <FormInput label="Context" placeholder="Course, module, or project" />
            <textarea
              rows={6}
              placeholder="Ask anything about your lessons, assignments, or ideas..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
            />
            <button className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
              Start conversation
            </button>
          </div>
          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Tip: share rubrics or uploaded notes for more tailored guidance.
          </div>
        </div>
        <ChatbotWidget />
      </section>
    </DashboardShell>
  );
}

