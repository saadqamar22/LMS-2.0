"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { createNotification } from "./notifications";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  user_id: string;
  full_name: string;
  role: string;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string | null;
  type: "direct" | "group";
  updated_at: string;
  participants: ConversationParticipant[]; // everyone except current user
  last_message: { body: string; sender_name: string; created_at: string } | null;
  unread_count: number;
  is_creator: boolean;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  created_at: string;
}

export interface CourseStudent {
  user_id: string;
  full_name: string;
  parent: { user_id: string; full_name: string } | null;
}

export interface CourseWithStudents {
  course_id: string;
  course_name: string;
  students: CourseStudent[];
}

export interface RecipientStudent {
  user_id: string;
  full_name: string;
  role: "student";
  course_id: string;
  course_name: string;
  parent: { user_id: string; full_name: string } | null;
}

export interface RecipientTeacher {
  user_id: string;
  full_name: string;
  role: "teacher";
  course_id: string;
  course_name: string;
}

export type Recipient = RecipientStudent | RecipientTeacher;

// ─── getConversations ────────────────────────────────────────────────────────

export async function getConversations(): Promise<{
  success: boolean;
  conversations: ConversationSummary[];
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) return { success: false, conversations: [], error: "Not authenticated" };

  const supabase = createAdminClient();
  const userId = session.userId;

  try {
    const { data: participations, error: pErr } = await (supabase as any)
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);

    if (pErr) throw pErr;
    if (!participations?.length) return { success: true, conversations: [] };

    const convIds = participations.map((p: any) => p.conversation_id);
    const lastReadMap: Record<string, string | null> = Object.fromEntries(
      participations.map((p: any) => [p.conversation_id, p.last_read_at])
    );

    const { data: conversations, error: cErr } = await (supabase as any)
      .from("conversations")
      .select("conversation_id, title, type, updated_at, created_by")
      .in("conversation_id", convIds)
      .order("updated_at", { ascending: false });

    if (cErr) throw cErr;

    const { data: allParticipants } = await (supabase as any)
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);

    const allUserIds = [...new Set((allParticipants ?? []).map((p: any) => p.user_id))] as string[];
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, role")
      .in("id", allUserIds);

    const userMap: Record<string, { full_name: string; role: string }> = Object.fromEntries(
      (users ?? []).map((u: any) => [u.id, { full_name: u.full_name, role: u.role }])
    );

    const participantsByConv: Record<string, ConversationParticipant[]> = {};
    for (const p of allParticipants ?? []) {
      const user = userMap[p.user_id];
      if (!participantsByConv[p.conversation_id]) participantsByConv[p.conversation_id] = [];
      if (user) {
        participantsByConv[p.conversation_id].push({
          user_id: p.user_id,
          full_name: user.full_name,
          role: user.role,
        });
      }
    }

    const results = await Promise.all(
      (conversations ?? []).map(async (conv: any) => {
        const { data: msgs } = await (supabase as any)
          .from("messages")
          .select("body, created_at, sender_id")
          .eq("conversation_id", conv.conversation_id)
          .order("created_at", { ascending: false })
          .limit(1);

        let last_message = null;
        if (msgs?.length) {
          const m = msgs[0];
          last_message = {
            body: m.body,
            sender_name: userMap[m.sender_id]?.full_name ?? "Unknown",
            created_at: m.created_at,
          };
        }

        const lastRead = lastReadMap[conv.conversation_id];
        let unreadQuery = (supabase as any)
          .from("messages")
          .select("message_id", { count: "exact", head: true })
          .eq("conversation_id", conv.conversation_id)
          .neq("sender_id", userId);
        if (lastRead) unreadQuery = unreadQuery.gt("created_at", lastRead);
        const { count: unread_count } = await unreadQuery;

        return {
          conversation_id: conv.conversation_id,
          title: conv.title,
          type: conv.type as "direct" | "group",
          updated_at: conv.updated_at,
          participants: (participantsByConv[conv.conversation_id] ?? []).filter(
            (p) => p.user_id !== userId
          ),
          last_message,
          unread_count: unread_count ?? 0,
          is_creator: conv.created_by === userId,
        };
      })
    );

    return { success: true, conversations: results };
  } catch (err: any) {
    return { success: false, conversations: [], error: err.message };
  }
}

// ─── getMessages ─────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<{
  success: boolean;
  messages: Message[];
  participants: ConversationParticipant[];
  conversationTitle: string | null;
  conversationType: "direct" | "group";
  error?: string;
}> {
  const empty = { success: false, messages: [], participants: [], conversationTitle: null, conversationType: "direct" as const };
  const session = await getCurrentSession();
  if (!session) return { ...empty, error: "Not authenticated" };

  const supabase = createAdminClient();
  const userId = session.userId;

  try {
    const { data: participation } = await (supabase as any)
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!participation) return { ...empty, error: "Access denied" };

    const { data: conv } = await (supabase as any)
      .from("conversations")
      .select("title, type")
      .eq("conversation_id", conversationId)
      .single();

    const { data: allParticipants } = await (supabase as any)
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const participantUserIds = (allParticipants ?? []).map((p: any) => p.user_id) as string[];

    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, role")
      .in("id", participantUserIds);

    const userMap: Record<string, { full_name: string; role: string }> = Object.fromEntries(
      (users ?? []).map((u: any) => [u.id, { full_name: u.full_name, role: u.role }])
    );

    const participants: ConversationParticipant[] = participantUserIds.map((uid) => ({
      user_id: uid,
      full_name: userMap[uid]?.full_name ?? "Unknown",
      role: userMap[uid]?.role ?? "student",
    }));

    const { data: msgs, error: mErr } = await (supabase as any)
      .from("messages")
      .select("message_id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (mErr) throw mErr;

    const messages: Message[] = (msgs ?? []).map((m: any) => ({
      message_id: m.message_id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      sender_name: userMap[m.sender_id]?.full_name ?? "Unknown",
      sender_role: userMap[m.sender_id]?.role ?? "student",
      body: m.body,
      created_at: m.created_at,
    }));

    // Mark conversation as read
    await (supabase as any)
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    return {
      success: true,
      messages,
      participants,
      conversationTitle: conv?.title ?? null,
      conversationType: (conv?.type ?? "direct") as "direct" | "group",
    };
  } catch (err: any) {
    return { ...empty, error: err.message };
  }
}

// ─── sendMessage ─────────────────────────────────────────────────────────────

export async function sendMessage(conversationId: string, body: string): Promise<{
  success: boolean;
  message?: Message;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();
  const userId = session.userId;
  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: "Message cannot be empty" };

  try {
    const { data: participation } = await (supabase as any)
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!participation) return { success: false, error: "Access denied" };

    const { data: msg, error: mErr } = await (supabase as any)
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, body: trimmed })
      .select("message_id, conversation_id, sender_id, body, created_at")
      .single();

    if (mErr) throw mErr;

    // Notify other participants
    const { data: others } = await (supabase as any)
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", userId);

    for (const p of others ?? []) {
      await createNotification({
        userId: p.user_id,
        title: `New message from ${session.fullName}`,
        message: trimmed.length > 100 ? trimmed.slice(0, 97) + "…" : trimmed,
        type: "system",
        referenceId: conversationId,
        referenceType: "message",
      });
    }

    return {
      success: true,
      message: {
        message_id: msg.message_id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_name: session.fullName,
        sender_role: session.role,
        body: msg.body,
        created_at: msg.created_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── createConversation ──────────────────────────────────────────────────────

export async function createConversation(
  participantIds: string[],
  title?: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();
  const userId = session.userId;
  const allIds = [...new Set([userId, ...participantIds])];
  const type = allIds.length > 2 ? "group" : "direct";

  try {
    // For direct chats, reuse existing conversation between the same two people
    if (type === "direct") {
      const otherId = allIds.find((id) => id !== userId)!;

      const { data: myConvs } = await (supabase as any)
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (myConvs?.length) {
        const myConvIds = myConvs.map((c: any) => c.conversation_id);
        const { data: shared } = await (supabase as any)
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherId)
          .in("conversation_id", myConvIds);

        if (shared?.length) {
          const { data: existing } = await (supabase as any)
            .from("conversations")
            .select("conversation_id")
            .eq("type", "direct")
            .in("conversation_id", shared.map((c: any) => c.conversation_id))
            .limit(1)
            .single();

          if (existing) return { success: true, conversationId: existing.conversation_id };
        }
      }
    }

    const { data: conv, error: cErr } = await (supabase as any)
      .from("conversations")
      .insert({ title: title ?? null, type, created_by: userId })
      .select("conversation_id")
      .single();

    if (cErr) throw cErr;

    await (supabase as any).from("conversation_participants").insert(
      allIds.map((uid) => ({ conversation_id: conv.conversation_id, user_id: uid }))
    );

    return { success: true, conversationId: conv.conversation_id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── getAvailableRecipients ──────────────────────────────────────────────────
// Schema facts:
//   courses.teacher_id  = teacher's users.id  (user UUID, not a teachers-table FK)
//   enrollments.student_id = student's users.id (user UUID, not a students-table FK)
//   students.id         = student's users.id
//   students.parent_id  = parent's users.id  (null when no parent linked)

export async function getAvailableRecipients(): Promise<{
  success: boolean;
  recipients: Recipient[];
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) return { success: false, recipients: [], error: "Not authenticated" };

  const supabase = createAdminClient();
  const userId = session.userId;
  const role = session.role;

  try {
    // ── Teacher: return students enrolled in their courses ───────────────────
    if (role === "teacher") {
      const { data: courses } = await supabase
        .from("courses")
        .select("course_id, course_name")
        .eq("teacher_id", userId as any);

      if (!courses?.length) return { success: true, recipients: [] };

      const courseIds = courses.map((c: any) => c.course_id) as string[];
      const courseMap: Record<string, string> = Object.fromEntries(
        courses.map((c: any) => [c.course_id, c.course_name])
      );

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id, course_id")
        .in("course_id", courseIds as any);

      if (!enrollments?.length) return { success: true, recipients: [] };

      // student_id here IS the user UUID
      const studentUserIds = [...new Set(enrollments.map((e: any) => e.student_id))] as string[];

      const { data: studentUsers } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", studentUserIds);

      const studentNameMap: Record<string, string> = Object.fromEntries(
        (studentUsers ?? []).map((u: any) => [u.id, u.full_name])
      );

      // Parent info: students.id = student user UUID, students.parent_id = parent user UUID
      const { data: studentRows } = await supabase
        .from("students")
        .select("id, parent_id")
        .in("id", studentUserIds as any);

      const parentUserIds = (studentRows ?? [])
        .map((s: any) => s.parent_id)
        .filter(Boolean) as string[];

      const parentNameMap: Record<string, string> = {};
      if (parentUserIds.length) {
        const { data: parentUsers } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", parentUserIds);
        for (const u of parentUsers ?? []) {
          parentNameMap[(u as any).id] = (u as any).full_name;
        }
      }

      const parentByStudentUserId: Record<string, { user_id: string; full_name: string }> = {};
      for (const s of studentRows ?? []) {
        if ((s as any).parent_id) {
          parentByStudentUserId[(s as any).id] = {
            user_id: (s as any).parent_id,
            full_name: parentNameMap[(s as any).parent_id] ?? "Parent",
          };
        }
      }

      const seen = new Set<string>();
      const recipients: RecipientStudent[] = [];

      for (const enrollment of enrollments) {
        const studentUserId = (enrollment as any).student_id as string;
        if (seen.has(studentUserId)) continue;
        seen.add(studentUserId);

        recipients.push({
          user_id: studentUserId,
          full_name: studentNameMap[studentUserId] ?? "Student",
          role: "student",
          course_id: (enrollment as any).course_id,
          course_name: courseMap[(enrollment as any).course_id] ?? "",
          parent: parentByStudentUserId[studentUserId] ?? null,
        });
      }

      return { success: true, recipients };
    }

    // ── Student: return teachers of enrolled courses ──────────────────────────
    if (role === "student") {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", userId as any);

      if (!enrollments?.length) return { success: true, recipients: [] };

      const courseIds = enrollments.map((e: any) => e.course_id) as string[];

      const { data: courses } = await supabase
        .from("courses")
        .select("course_id, course_name, teacher_id")
        .in("course_id", courseIds);

      if (!courses?.length) return { success: true, recipients: [] };

      // teacher_id here IS the user UUID
      const teacherUserIds = [...new Set(courses.map((c: any) => c.teacher_id))] as string[];

      const { data: teacherUsers } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", teacherUserIds);

      const teacherNameMap: Record<string, string> = Object.fromEntries(
        (teacherUsers ?? []).map((u: any) => [u.id, u.full_name])
      );

      const seen = new Set<string>();
      const recipients: RecipientTeacher[] = [];

      for (const course of courses) {
        const teacherUserId = (course as any).teacher_id as string;
        if (seen.has(teacherUserId)) continue;
        seen.add(teacherUserId);

        recipients.push({
          user_id: teacherUserId,
          full_name: teacherNameMap[teacherUserId] ?? "Teacher",
          role: "teacher",
          course_id: (course as any).course_id,
          course_name: (course as any).course_name,
        });
      }

      return { success: true, recipients };
    }

    // ── Parent: return teachers of their child's enrolled courses ────────────
    if (role === "parent") {
      // Find the student whose parent_id = this parent's userId
      const { data: studentRow } = await supabase
        .from("students")
        .select("id")
        .eq("parent_id", userId as any)
        .maybeSingle();

      if (!studentRow) return { success: true, recipients: [] };

      const studentUserId = (studentRow as any).id as string;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", studentUserId as any);

      if (!enrollments?.length) return { success: true, recipients: [] };

      const courseIds = enrollments.map((e: any) => e.course_id) as string[];

      const { data: courses } = await supabase
        .from("courses")
        .select("course_id, course_name, teacher_id")
        .in("course_id", courseIds);

      if (!courses?.length) return { success: true, recipients: [] };

      const teacherUserIds = [...new Set(courses.map((c: any) => c.teacher_id))] as string[];

      const { data: teacherUsers } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", teacherUserIds);

      const teacherNameMap: Record<string, string> = Object.fromEntries(
        (teacherUsers ?? []).map((u: any) => [u.id, u.full_name])
      );

      const seen = new Set<string>();
      const recipients: RecipientTeacher[] = [];

      for (const course of courses) {
        const teacherUserId = (course as any).teacher_id as string;
        if (seen.has(teacherUserId)) continue;
        seen.add(teacherUserId);

        recipients.push({
          user_id: teacherUserId,
          full_name: teacherNameMap[teacherUserId] ?? "Teacher",
          role: "teacher",
          course_id: (course as any).course_id,
          course_name: (course as any).course_name,
        });
      }

      return { success: true, recipients };
    }

    return { success: true, recipients: [] };
  } catch (err: any) {
    return { success: false, recipients: [], error: err.message };
  }
}

// ─── getTotalUnreadCount (for notification badge) ────────────────────────────

export async function getTotalUnreadMessageCount(): Promise<number> {
  const session = await getCurrentSession();
  if (!session) return 0;

  const supabase = createAdminClient();
  const userId = session.userId;

  try {
    const { data: participations } = await (supabase as any)
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);

    if (!participations?.length) return 0;

    let total = 0;
    await Promise.all(
      participations.map(async (p: any) => {
        let q = (supabase as any)
          .from("messages")
          .select("message_id", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", userId);
        if (p.last_read_at) q = q.gt("created_at", p.last_read_at);
        const { count } = await q;
        total += count ?? 0;
      })
    );

    return total;
  } catch {
    return 0;
  }
}

// ─── getTeacherCoursesWithStudents ───────────────────────────────────────────

export async function getTeacherCoursesWithStudents(): Promise<{
  success: boolean;
  courses: CourseWithStudents[];
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) return { success: false, courses: [], error: "Not authenticated" };
  if (session.role !== "teacher") return { success: false, courses: [], error: "Access denied" };

  const supabase = createAdminClient();
  const userId = session.userId;

  try {
    // courses.teacher_id = teacher's user UUID directly
    const { data: courses } = await supabase
      .from("courses")
      .select("course_id, course_name")
      .eq("teacher_id", userId as any);

    if (!courses?.length) return { success: true, courses: [] };

    const courseIds = courses.map((c: any) => c.course_id) as string[];

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id, course_id")
      .in("course_id", courseIds as any);

    if (!enrollments?.length) {
      return {
        success: true,
        courses: courses.map((c: any) => ({ course_id: c.course_id, course_name: c.course_name, students: [] })),
      };
    }

    // enrollment.student_id IS the student's user UUID
    const studentUserIds = [...new Set(enrollments.map((e: any) => e.student_id))] as string[];

    const { data: studentUsers } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", studentUserIds);

    const studentNameMap: Record<string, string> = Object.fromEntries(
      (studentUsers ?? []).map((u: any) => [u.id, u.full_name])
    );

    // students.id = student user UUID, students.parent_id = parent user UUID
    const { data: studentRows } = await supabase
      .from("students")
      .select("id, parent_id")
      .in("id", studentUserIds as any);

    const parentUserIds = (studentRows ?? [])
      .map((s: any) => s.parent_id)
      .filter(Boolean) as string[];

    const parentNameMap: Record<string, string> = {};
    if (parentUserIds.length) {
      const { data: parentUsers } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", parentUserIds);
      for (const u of parentUsers ?? []) {
        parentNameMap[(u as any).id] = (u as any).full_name;
      }
    }

    const parentByStudentUserId: Record<string, { user_id: string; full_name: string }> = {};
    for (const s of studentRows ?? []) {
      if ((s as any).parent_id) {
        parentByStudentUserId[(s as any).id] = {
          user_id: (s as any).parent_id,
          full_name: parentNameMap[(s as any).parent_id] ?? "Parent",
        };
      }
    }

    const result: CourseWithStudents[] = courses.map((course: any) => {
      const courseEnrollments = enrollments.filter((e: any) => e.course_id === course.course_id);
      const seen = new Set<string>();
      const students: CourseStudent[] = [];

      for (const enrollment of courseEnrollments) {
        const studentUserId = (enrollment as any).student_id as string;
        if (seen.has(studentUserId)) continue;
        seen.add(studentUserId);

        students.push({
          user_id: studentUserId,
          full_name: studentNameMap[studentUserId] ?? "Student",
          parent: parentByStudentUserId[studentUserId] ?? null,
        });
      }

      return { course_id: course.course_id, course_name: course.course_name, students };
    });

    return { success: true, courses: result };
  } catch (err: any) {
    return { success: false, courses: [], error: err.message };
  }
}

// ─── deleteConversation ──────────────────────────────────────────────────────

export async function deleteConversation(conversationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();
  const userId = session.userId;

  try {
    const { data: conv } = await (supabase as any)
      .from("conversations")
      .select("created_by")
      .eq("conversation_id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };
    if (conv.created_by !== userId) return { success: false, error: "Only the creator can delete this conversation" };

    const { error } = await (supabase as any)
      .from("conversations")
      .delete()
      .eq("conversation_id", conversationId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
