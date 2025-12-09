"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

/**
 * Convert percentage to GPA (out of 4.0)
 * Standard conversion:
 * 90-100% = 4.0
 * 80-89% = 3.0-3.9
 * 70-79% = 2.0-2.9
 * 60-69% = 1.0-1.9
 * Below 60% = 0.0
 */
export function percentageToGPA(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0 + ((percentage - 80) / 10) * 1.0;
  if (percentage >= 70) return 2.0 + ((percentage - 70) / 10) * 1.0;
  if (percentage >= 60) return 1.0 + ((percentage - 60) / 10) * 1.0;
  return 0.0;
}

/**
 * Convert GPA to percentage
 */
export function gpaToPercentage(gpa: number): number {
  if (gpa >= 4.0) return 100;
  if (gpa >= 3.0) return 80 + ((gpa - 3.0) / 1.0) * 10;
  if (gpa >= 2.0) return 70 + ((gpa - 2.0) / 1.0) * 10;
  if (gpa >= 1.0) return 60 + ((gpa - 1.0) / 1.0) * 10;
  return (gpa / 1.0) * 60;
}

/**
 * Calculate student's overall GPA and percentage
 */
export async function calculateStudentGPA(
  studentId?: string,
): Promise<
  | { success: true; gpa: number; percentage: number }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  const targetStudentId = studentId || session.userId;

  // If teacher is viewing a student, verify they teach that student
  if (session.role === "teacher" && studentId) {
    // We'll verify this in the query by checking course ownership
  } else if (session.role === "student" && studentId && studentId !== session.userId) {
    return {
      success: false,
      error: "You can only view your own GPA.",
    };
  } else if (session.role !== "student" && session.role !== "teacher") {
    return {
      success: false,
      error: "Only students and teachers can view GPA.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Fetch all marks for the student
    let query = supabase
      .from("marks")
      .select(`
        obtained_marks,
        modules!marks_module_id_fkey (
          total_marks,
          course_id,
          courses!modules_course_id_fkey (
            course_id,
            teacher_id
          )
        )
      `)
      .eq("student_id", targetStudentId);

    // If teacher, only show marks from their courses
    if (session.role === "teacher" && studentId) {
      // We'll filter by teacher's courses after fetching
    }

    const { data: marks, error: marksError } = await query;

    if (marksError) {
      console.error("Error fetching marks for GPA:", JSON.stringify(marksError, null, 2));
      return {
        success: false,
        error: marksError.message || "Failed to fetch marks.",
      };
    }

    if (!marks || marks.length === 0) {
      return {
        success: true,
        gpa: 0.0,
        percentage: 0,
      };
    }

    // Filter marks: only include those with valid obtained_marks and total_marks
    // If teacher, filter by their courses
    const validMarks = marks
      .filter((mark) => {
        if (!mark.obtained_marks || !mark.modules?.total_marks) return false;
        if (session.role === "teacher" && studentId) {
          return mark.modules?.courses?.teacher_id === session.userId;
        }
        return true;
      })
      .map((mark) => ({
        obtained: mark.obtained_marks!,
        total: mark.modules!.total_marks!,
      }));

    if (validMarks.length === 0) {
      return {
        success: true,
        gpa: 0.0,
        percentage: 0,
      };
    }

    // Calculate weighted average percentage
    const totalObtained = validMarks.reduce((sum, m) => sum + m.obtained, 0);
    const totalPossible = validMarks.reduce((sum, m) => sum + m.total, 0);
    const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

    // Convert to GPA
    const gpa = percentageToGPA(percentage);

    return {
      success: true,
      gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
      percentage: Math.round(percentage * 100) / 100,
    };
  } catch (error) {
    console.error("Unexpected error calculating GPA:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Calculate GPA for a specific course
 */
export async function calculateCourseGPA(
  courseId: string,
  studentId?: string,
): Promise<
  | { success: true; gpa: number; percentage: number }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  const targetStudentId = studentId || session.userId;

  if (session.role === "student" && studentId && studentId !== session.userId) {
    return {
      success: false,
      error: "You can only view your own GPA.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify course exists and teacher owns it (if teacher)
    if (session.role === "teacher") {
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
          error: "You do not have permission to view GPA for this course.",
        };
      }
    }

    // Fetch marks for this course
    const { data: marks, error: marksError } = await supabase
      .from("marks")
      .select(`
        obtained_marks,
        modules!marks_module_id_fkey (
          total_marks,
          course_id
        )
      `)
      .eq("student_id", targetStudentId)
      .eq("modules.course_id", courseId);

    if (marksError) {
      console.error("Error fetching course marks for GPA:", JSON.stringify(marksError, null, 2));
      return {
        success: false,
        error: marksError.message || "Failed to fetch marks.",
      };
    }

    if (!marks || marks.length === 0) {
      return {
        success: true,
        gpa: 0.0,
        percentage: 0,
      };
    }

    // Filter valid marks
    const validMarks = marks
      .filter((mark) => mark.obtained_marks && mark.modules?.total_marks)
      .map((mark) => ({
        obtained: mark.obtained_marks!,
        total: mark.modules!.total_marks!,
      }));

    if (validMarks.length === 0) {
      return {
        success: true,
        gpa: 0.0,
        percentage: 0,
      };
    }

    // Calculate weighted average percentage
    const totalObtained = validMarks.reduce((sum, m) => sum + m.obtained, 0);
    const totalPossible = validMarks.reduce((sum, m) => sum + m.total, 0);
    const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

    // Convert to GPA
    const gpa = percentageToGPA(percentage);

    return {
      success: true,
      gpa: Math.round(gpa * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  } catch (error) {
    console.error("Unexpected error calculating course GPA:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

