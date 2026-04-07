import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { SummarizerClient } from "./summarizer-client";

export default async function AISummarizerPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  return (
    <DashboardShell role={currentUser.role as "student" | "teacher" | "parent" | "admin"}>
      <section>
        <p className="text-xs uppercase tracking-wide text-slate-400">AI Tools</p>
        <h1 className="text-2xl font-semibold text-slate-900">Content Summarizer</h1>
        <p className="mt-1 text-sm text-slate-500">Paste any text — lecture notes, articles, chapters — and get an instant AI summary.</p>
      </section>
      <SummarizerClient />
    </DashboardShell>
  );
}
