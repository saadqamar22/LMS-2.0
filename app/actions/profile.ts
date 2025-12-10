"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: "student" | "teacher" | "parent" | "admin";
  // Student specific
  registration_number?: string | null;
  class?: string | null;
  section?: string | null;
  parent_id?: string | null;
  // Teacher specific
  employee_id?: string | null;
  department?: string | null;
  designation?: string | null;
  // Parent specific
  phone_number?: string | null;
  address?: string | null;
}

/**
 * Get current user's profile with role-specific information
 */
export async function getUserProfile(): Promise<
  | { success: true; profile: UserProfile }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const supabase = createAdminClient();

    // Get base user information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("id", session.userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: "User not found.",
      };
    }

    const userData = user as {
      id: string;
      full_name: string | null;
      email: string;
      role: string;
    };

    const profile: UserProfile = {
      id: userData.id,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role as "student" | "teacher" | "parent" | "admin",
    };

    // Get role-specific information
    if (userData.role === "student") {
      const { data: student } = await supabase
        .from("students")
        .select("registration_number, class, section, parent_id")
        .eq("id", session.userId)
        .single();

      if (student) {
        profile.registration_number = student.registration_number;
        profile.class = student.class;
        profile.section = student.section;
        profile.parent_id = student.parent_id;
      }
    } else if (userData.role === "teacher") {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("employee_id, department, designation")
        .eq("id", session.userId)
        .single();

      if (teacher) {
        profile.employee_id = teacher.employee_id;
        profile.department = teacher.department;
        profile.designation = teacher.designation;
      }
    } else if (userData.role === "parent") {
      const { data: parent } = await supabase
        .from("parents")
        .select("phone_number, address, full_name")
        .eq("id", session.userId)
        .single();

      if (parent) {
        profile.phone_number = parent.phone_number;
        profile.address = parent.address;
        // Use parent's full_name if available (from parents table)
        if (parent.full_name) {
          profile.full_name = parent.full_name;
        }
      }
    }

    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

