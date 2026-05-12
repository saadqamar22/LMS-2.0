import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getConversations, getAvailableRecipients } from "@/app/actions/messages";
import { NewDirectConversationButton } from "../../student/messages/new-direct-conversation-button";
import { DeleteConversationButton } from "@/components/messages/delete-conversation-button";

function formatPreview(body: string) {
  return body.length > 80 ? body.slice(0, 77) + "…" : body;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default async function ParentMessagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (currentUser.role !== "parent") redirect("/parent/dashboard");

  const [conversationsResult, recipientsResult] = await Promise.all([
    getConversations(),
    getAvailableRecipients(),
  ]);

  const conversations = conversationsResult.success ? conversationsResult.conversations : [];
  const recipients = recipientsResult.success ? recipientsResult.recipients : [];

  return (
    <DashboardShell role="parent">
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Messages</p>
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          <p className="mt-1 text-sm text-slate-500">Message your child's teachers</p>
        </div>
        <NewDirectConversationButton recipients={recipients} role="parent" />
      </section>

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Start a conversation with one of your child's teachers."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {conversations.map((conv) => {
            const displayName =
              (conv.title ?? conv.participants.map((p) => p.full_name).join(", ")) ||
              "Conversation";

            return (
              <div key={conv.conversation_id} className="flex items-center hover:bg-slate-50 transition">
                <Link
                  href={`/parent/messages/${conv.conversation_id}`}
                  className="flex flex-1 items-start gap-4 px-5 py-4 min-w-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {conv.unread_count > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                            {conv.unread_count > 9 ? "9+" : conv.unread_count}
                          </span>
                        )}
                        {conv.last_message && (
                          <span className="text-xs text-slate-400">
                            {timeLabel(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {conv.last_message ? (
                      <p className={`mt-0.5 text-sm truncate ${conv.unread_count > 0 ? "font-medium text-slate-800" : "text-slate-400"}`}>
                        {conv.last_message.sender_name}: {formatPreview(conv.last_message.body)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-slate-400 italic">No messages yet</p>
                    )}
                  </div>
                </Link>

                {conv.is_creator && (
                  <div className="pr-4 shrink-0">
                    <DeleteConversationButton conversationId={conv.conversation_id} role="parent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
