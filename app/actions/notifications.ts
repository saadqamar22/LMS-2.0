"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: "assignment_graded" | "new_assignment" | "quiz_published" | "mark_posted" | "announcement" | "system";
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string | null;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: Notification["type"];
  referenceId?: string;
  referenceType?: string;
}

// ─── Internal helper (called from other server actions) ─────────────────────

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await (supabase.from("notifications") as any).insert([{
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      reference_id: input.referenceId || null,
      reference_type: input.referenceType || null,
      is_read: false,
    }]);
  } catch (err) {
    // Notifications are non-critical — log but don't throw
    console.error("Failed to create notification:", err);
  }
}

// ─── Get current user's notifications ──────────────────────────────────────

export async function getUserNotifications(limit = 20): Promise<
  { success: true; notifications: Notification[]; unreadCount: number } | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { success: false, error: error.message };

    const notifications = (data || []) as Notification[];
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return { success: true, notifications, unreadCount };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Mark one notification as read ─────────────────────────────────────────

export async function markNotificationRead(
  notificationId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();
    const { error } = await (supabase.from("notifications") as any)
      .update({ is_read: true })
      .eq("notification_id", notificationId)
      .eq("user_id", session.userId); // safety: only own notifications

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ─── Mark all as read ───────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<
  { success: true } | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();
    const { error } = await (supabase.from("notifications") as any)
      .update({ is_read: true })
      .eq("user_id", session.userId)
      .eq("is_read", false);

    if (error) return { success: false, error: error.message };
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}
