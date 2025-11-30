"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

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

/**
 * Create a new module for a course (teacher only)
 */
export async function createModule(
  courseId: string,
  moduleName: string,
  totalMarks: number,
): Promise<
  | { success: true; module: Module }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can create modules.",
    };
  }

  if (!moduleName?.trim()) {
    return { success: false, error: "Module name is required." };
  }

  if (totalMarks <= 0) {
    return { success: false, error: "Total marks must be greater than 0." };
  }

  try {
    const supabase = createAdminClient();

    // Verify course exists and teacher owns it
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id, teacher_id")
      .eq("course_id", courseId)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Course not found.",
      };
    }

    if (course.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to create modules for this course.",
      };
    }

    // Create module
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .insert({
        course_id: courseId,
        module_name: moduleName.trim(),
        total_marks: totalMarks,
      })
      .select()
      .single();

    if (moduleError) {
      console.error("Error creating module:", JSON.stringify(moduleError, null, 2));
      return {
        success: false,
        error: moduleError.message || "Failed to create module.",
      };
    }

    revalidatePath(`/teacher/courses/${courseId}/marks`);
    revalidatePath(`/teacher/courses/${courseId}`);

    return {
      success: true,
      module: {
        module_id: module.module_id,
        module_name: module.module_name,
        total_marks: module.total_marks,
        course_id: module.course_id,
        created_at: module.created_at,
      },
    };
  } catch (error) {
    console.error("Unexpected error creating module:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

