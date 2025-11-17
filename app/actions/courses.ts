"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface CreateCourseInput {
  course_name: string;
  course_code: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
  teacher_id: string;
  created_at: string;
}

export async function createCourse(
  input: CreateCourseInput,
): Promise<{ success: true; courseId: string } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in to create a course." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can create courses.",
    };
  }

  if (!input.course_name?.trim()) {
    return { success: false, error: "Course name is required." };
  }

  if (!input.course_code?.trim()) {
    return { success: false, error: "Course code is required." };
  }

  try {
    const supabase = createAdminClient();

    const { data: course, error } = await supabase
      .from("courses")
      .insert([
        {
          teacher_id: session.userId,
          course_name: input.course_name.trim(),
          course_code: input.course_code.trim(),
        },
      ])
      .select("course_id")
      .single();

    if (error) {
      console.error("Course creation error:", error);
      return {
        success: false,
        error: error.message || "Failed to create course.",
      };
    }

    if (!course?.course_id) {
      return {
        success: false,
        error: "Course was created but ID was not returned.",
      };
    }

    revalidatePath("/teacher/courses");
    return { success: true, courseId: course.course_id };
  } catch (error) {
    console.error("Unexpected error creating course:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function getTeacherCourses(): Promise<
  | { success: true; courses: Course[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view their courses.",
    };
  }

  try {
    const supabase = createAdminClient();

    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .eq("teacher_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch courses.",
      };
    }

    return {
      success: true,
      courses: (courses || []) as Course[],
    };
  } catch (error) {
    console.error("Unexpected error fetching courses:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function getCourseById(
  courseId: string,
): Promise<
  | { success: true; course: Course }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const supabase = createAdminClient();

    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("course_id", courseId)
      .single();

    if (error) {
      console.error("Error fetching course:", error);
      return {
        success: false,
        error: error.message || "Course not found.",
      };
    }

    if (!course) {
      return { success: false, error: "Course not found." };
    }

    if (session.role === "teacher" && course.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view this course.",
      };
    }

    return {
      success: true,
      course: course as Course,
    };
  } catch (error) {
    console.error("Unexpected error fetching course:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

