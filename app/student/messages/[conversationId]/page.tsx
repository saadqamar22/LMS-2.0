import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MessageThread } from "@/components/messages/message-thread";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMessages } from "@/app/actions/messages";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function StudentConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (currentUser.role !== "student") redirect("/student/dashboard");

  const result = await getMessages(conversationId);

  if (!result.success) {
    if (result.error === "Access denied") notFound();
    return (
      <DashboardShell role="student">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{result.error}</div>
      </DashboardShell>
    );
  }

  const displayTitle =
    (result.conversationTitle ??
      result.participants
        .filter((p) => p.user_id !== currentUser.id)
        .map((p) => p.full_name)
        .join(", ")) ||
    "Conversation";

  return (
    <DashboardShell role="student">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/student/messages"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{displayTitle}</h1>
          {result.conversationType === "group" && (
            <p className="text-xs text-slate-400">
              {result.participants.map((p) => p.full_name).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
        style={{ height: "calc(100vh - 220px)" }}
      >
        <MessageThread
          conversationId={conversationId}
          initialMessages={result.messages}
          participants={result.participants}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      </div>
    </DashboardShell>
  );
}
