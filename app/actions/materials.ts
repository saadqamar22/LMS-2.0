"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface Material {
  material_id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: "pdf" | "video" | "link" | "image" | "other";
  file_url: string | null;
  external_url: string | null;
  created_at: string | null;
}

export interface AddMaterialInput {
  courseId: string;
  title: string;
  description?: string;
  type: "pdf" | "video" | "link" | "image" | "other";
  fileUrl?: string;
  externalUrl?: string;
}

export async function getMaterialsByCourse(
  courseId: string,
): Promise<{ success: true; materials: Material[] } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, materials: (data || []) as Material[] };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function addMaterial(
  input: AddMaterialInput,
): Promise<{ success: true; materialId: string } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Only teachers can add materials." };

  if (!input.title?.trim()) return { success: false, error: "Title is required." };
  if (input.type === "link" && !input.externalUrl?.trim())
    return { success: false, error: "URL is required for link type." };
  if (input.type !== "link" && !input.fileUrl)
    return { success: false, error: "File is required." };

  try {
    const supabase = createAdminClient();

    // Verify teacher owns the course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("course_id", input.courseId)
      .single();

    if (courseError || !course) return { success: false, error: "Course not found." };
    const c = course as { teacher_id: string };
    if (c.teacher_id !== session.userId)
      return { success: false, error: "You do not have permission to add materials to this course." };

    const { data, error } = await (supabase.from("materials") as any).insert([
      {
        course_id: input.courseId,
        teacher_id: session.userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        type: input.type,
        file_url: input.fileUrl || null,
        external_url: input.externalUrl?.trim() || null,
      },
    ]).select("material_id").single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${input.courseId}`);
    revalidatePath(`/student/courses/${input.courseId}`);
    return { success: true, materialId: data.material_id };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteMaterial(
  materialId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "You must be logged in." };
  if (session.role !== "teacher") return { success: false, error: "Only teachers can delete materials." };

  try {
    const supabase = createAdminClient();

    const { data: material, error: fetchError } = await supabase
      .from("materials")
      .select("material_id, course_id, teacher_id")
      .eq("material_id", materialId)
      .single();

    if (fetchError || !material) return { success: false, error: "Material not found." };
    const m = material as { teacher_id: string; course_id: string };
    if (m.teacher_id !== session.userId)
      return { success: false, error: "You do not have permission to delete this material." };

    const { error } = await (supabase.from("materials") as any)
      .delete()
      .eq("material_id", materialId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/teacher/courses/${m.course_id}`);
    revalidatePath(`/student/courses/${m.course_id}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}
