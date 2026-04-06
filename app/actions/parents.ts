"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

function generateParentKey(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) key += "-";
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

/**
 * Get the parent_key for the currently logged-in student.
 * Auto-generates one if the student doesn't have one yet (e.g. registered before the feature).
 */
export async function getStudentParentKey(): Promise<
  { success: true; parentKey: string | null; hasParent: boolean } | { success: false; error: string }
> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "Not logged in." };
  if (session.role !== "student") return { success: false, error: "Students only." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("students")
      .select("parent_key, parent_id")
      .eq("id", session.userId)
      .single();

    if (error || !data) return { success: false, error: "Student record not found." };
    const d = data as { parent_key: string | null; parent_id: string | null };

    let parentKey = d.parent_key;

    // Auto-generate a parent_key for students who registered before the feature was added
    if (!parentKey) {
      let newKey = generateParentKey();
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("parent_key", newKey)
          .maybeSingle();
        if (!existing) break;
        newKey = generateParentKey();
      }
      await (supabase.from("students") as any)
        .update({ parent_key: newKey })
        .eq("id", session.userId);
      parentKey = newKey;
    }

    return { success: true, parentKey, hasParent: d.parent_id !== null };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export interface ChildInfo {
  student_id: string;
  full_name: string;
  registration_number: string | null;
  class: string | null;
  section: string | null;
}

/**
 * Get all children for the logged-in parent
 */
export async function getParentChildren(): Promise<
  | { success: true; children: ChildInfo[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "parent") {
    return {
      success: false,
      error: "Only parents can view their children.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Fetch students where parent_id matches the logged-in parent
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select(`
        id,
        registration_number,
        class,
        section,
        users!students_id_fkey (
          full_name
        )
      `)
      .eq("parent_id", session.userId);

    if (studentsError) {
      console.error(
        "Error fetching children:",
        JSON.stringify(studentsError, null, 2),
      );
      return {
        success: false,
        error: studentsError.message || "Failed to fetch children.",
      };
    }

    // Transform the data
    const children: ChildInfo[] = (students || [])
      .map(
        (student: {
          id: string;
          registration_number: string | null;
          class: string | null;
          section: string | null;
          users?: {
            full_name: string | null;
          } | null;
        }) => ({
          student_id: student.id,
          full_name: student.users?.full_name || "Unknown",
          registration_number: student.registration_number,
          class: student.class,
          section: student.section,
        }),
      )
      .filter((child) => child.full_name !== "Unknown");

    return {
      success: true,
      children,
    };
  } catch (error) {
    console.error("Unexpected error fetching children:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Verify that a child belongs to the logged-in parent
 */
export async function verifyChildAccess(
  childId: string,
): Promise<{ hasAccess: boolean; childName?: string } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "parent") {
    return { success: false, error: "Only parents can access child data." };
  }

  try {
    const supabase = createAdminClient();

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select(`
        id,
        parent_id,
        users!students_id_fkey (
          full_name
        )
      `)
      .eq("id", childId)
      .single();

    if (studentError || !student) {
      return { hasAccess: false };
    }

    const studentData = student as {
      id: string;
      parent_id: string | null;
      users?: { full_name: string | null } | null;
    };
    if (studentData.parent_id !== session.userId) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      childName: studentData.users?.full_name || "Unknown",
    };
  } catch (error) {
    console.error("Unexpected error verifying child access:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
