"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

export interface Module {
  module_id: string;
  module_name: string;
  total_marks: number;
  course_id: string;
  created_at: string | null;
}

/**
 * Get modules for a course
 */
export async function getModulesForCourse(
  courseId: string,
): Promise<
  | { success: true; modules: Module[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const supabase = createAdminClient();

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("module_id, module_name, total_marks, course_id, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", JSON.stringify(modulesError, null, 2));
      return {
        success: false,
        error: modulesError.message || "Failed to fetch modules.",
      };
    }

    return {
      success: true,
      modules: (modules || []).map(
        (m: {
          module_id: string;
          module_name: string;
          total_marks: number;
          course_id: string;
          created_at: string | null;
        }) => ({
          module_id: m.module_id,
          module_name: m.module_name,
          total_marks: m.total_marks,
          course_id: m.course_id,
          created_at: m.created_at,
        }),
      ),
    };
  } catch (error) {
    console.error("Unexpected error fetching modules:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

