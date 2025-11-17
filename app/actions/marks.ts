"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface MarkEntry {
  id: string;
  student_id: string;
  module_id: string;
  course_id: string;
  marks_obtained: number | null;
  total_marks: number | null;
  feedback: string | null;
  student_name?: string;
  registration_number?: string | null;
  module_name?: string;
  course_name?: string;
  course_code?: string;
}

export interface SaveMarkInput {
  courseId: string;
  moduleId: string;
  studentId: string;
  marksObtained: number;
  totalMarks: number;
  feedback?: string;
}

/**
 * Save or update marks for a student in a module (teacher only)
 */
export async function saveMark(
  input: SaveMarkInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can enter marks.",
    };
  }

  if (!input.courseId || !input.moduleId || !input.studentId) {
    return {
      success: false,
      error: "Course, module, and student are required.",
    };
  }

  if (input.marksObtained < 0 || input.totalMarks <= 0) {
    return {
      success: false,
      error: "Invalid marks. Marks obtained must be >= 0 and total marks must be > 0.",
    };
  }

  if (input.marksObtained > input.totalMarks) {
    return {
      success: false,
      error: "Marks obtained cannot exceed total marks.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify course exists and teacher owns it
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id, teacher_id")
      .eq("course_id", input.courseId)
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
        error: "You do not have permission to enter marks for this course.",
      };
    }

    // Verify module belongs to course
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select("module_id, course_id")
      .eq("module_id", input.moduleId)
      .eq("course_id", input.courseId)
      .single();

    if (moduleError || !module) {
      return {
        success: false,
        error: "Module not found or does not belong to this course.",
      };
    }

    // Upsert mark
    const { error: markError } = await supabase
      .from("marks")
      .upsert(
        {
          student_id: input.studentId,
          module_id: input.moduleId,
          course_id: input.courseId,
          marks_obtained: input.marksObtained,
          total_marks: input.totalMarks,
          feedback: input.feedback?.trim() || null,
        },
        {
          onConflict: "student_id,module_id",
        },
      );

    if (markError) {
      console.error("Error saving mark:", JSON.stringify(markError, null, 2));
      return {
        success: false,
        error: markError.message || "Failed to save mark.",
      };
    }

    revalidatePath(`/teacher/courses/${input.courseId}/marks`);
    revalidatePath(`/student/marks`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving mark:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get marks for a course and module (teacher only)
 */
export async function getMarksForModule(
  courseId: string,
  moduleId: string,
): Promise<
  | { success: true; marks: MarkEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view marks.",
    };
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
        error: "You do not have permission to view marks for this course.",
      };
    }

    // Fetch marks with student and module info
    const { data: marks, error: marksError } = await supabase
      .from("marks")
      .select(`
        id,
        student_id,
        module_id,
        course_id,
        marks_obtained,
        total_marks,
        feedback,
        students!marks_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        ),
        modules!marks_module_id_fkey (
          module_id,
          module_name
        )
      `)
      .eq("course_id", courseId)
      .eq("module_id", moduleId);

    if (marksError) {
      console.error("Error fetching marks:", JSON.stringify(marksError, null, 2));
      return {
        success: false,
        error: marksError.message || "Failed to fetch marks.",
      };
    }

    // Transform the data
    const marksList: MarkEntry[] = (marks || []).map(
      (mark: {
        id: string;
        student_id: string;
        module_id: string;
        course_id: string;
        marks_obtained: number | null;
        total_marks: number | null;
        feedback: string | null;
        students?: {
          id: string;
          registration_number: string | null;
          users?: {
            full_name: string | null;
          } | null;
        } | null;
        modules?: {
          module_id: string;
          module_name: string;
        } | null;
      }) => ({
        id: mark.id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        course_id: mark.course_id,
        marks_obtained: mark.marks_obtained,
        total_marks: mark.total_marks,
        feedback: mark.feedback,
        student_name: mark.students?.users?.full_name || "Unknown",
        registration_number: mark.students?.registration_number || null,
        module_name: mark.modules?.module_name || "Unknown Module",
      }),
    );

    return {
      success: true,
      marks: marksList.sort((a, b) => {
        const nameA = a.student_name || "";
        const nameB = b.student_name || "";
        return nameA.localeCompare(nameB);
      }),
    };
  } catch (error) {
    console.error("Unexpected error fetching marks:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get student's marks (student only)
 */
export async function getStudentMarks(
  courseId?: string,
): Promise<
  | { success: true; marks: MarkEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view their own marks.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("marks")
      .select(`
        id,
        student_id,
        module_id,
        course_id,
        marks_obtained,
        total_marks,
        feedback,
        modules!marks_module_id_fkey (
          module_id,
          module_name
        ),
        courses!marks_course_id_fkey (
          course_id,
          course_name,
          course_code
        )
      `)
      .eq("student_id", session.userId);

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: marks, error: marksError } = await query;

    if (marksError) {
      console.error(
        "Error fetching student marks:",
        JSON.stringify(marksError, null, 2),
      );
      return {
        success: false,
        error: marksError.message || "Failed to fetch marks.",
      };
    }

    // Transform the data
    const marksList: MarkEntry[] = (marks || []).map(
      (mark: {
        id: string;
        student_id: string;
        module_id: string;
        course_id: string;
        marks_obtained: number | null;
        total_marks: number | null;
        feedback: string | null;
        modules?: {
          module_id: string;
          module_name: string;
        } | null;
        courses?: {
          course_id: string;
          course_name: string;
          course_code: string;
        } | null;
      }) => ({
        id: mark.id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        course_id: mark.course_id,
        marks_obtained: mark.marks_obtained,
        total_marks: mark.total_marks,
        feedback: mark.feedback,
        module_name: mark.modules?.module_name || "Unknown Module",
        course_name: mark.courses?.course_name,
        course_code: mark.courses?.course_code,
      }),
    );

    return {
      success: true,
      marks: marksList,
    };
  } catch (error) {
    console.error("Unexpected error fetching student marks:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get marks for a parent's child (parent only)
 */
export async function getChildMarks(
  childId: string,
): Promise<
  | { success: true; marks: MarkEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "parent") {
    return {
      success: false,
      error: "Only parents can view their children's marks.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify the child belongs to this parent
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, parent_id")
      .eq("id", childId)
      .single();

    if (studentError || !student) {
      return {
        success: false,
        error: "Student not found.",
      };
    }

    if (student.parent_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view this student's marks.",
      };
    }

    // Fetch marks
    const { data: marks, error: marksError } = await supabase
      .from("marks")
      .select(`
        id,
        student_id,
        module_id,
        course_id,
        marks_obtained,
        total_marks,
        feedback,
        modules!marks_module_id_fkey (
          module_id,
          module_name
        ),
        courses!marks_course_id_fkey (
          course_id,
          course_name,
          course_code
        )
      `)
      .eq("student_id", childId)
      .order("course_id", { ascending: true });

    if (marksError) {
      console.error(
        "Error fetching child marks:",
        JSON.stringify(marksError, null, 2),
      );
      return {
        success: false,
        error: marksError.message || "Failed to fetch marks.",
      };
    }

    // Transform the data
    const marksList: MarkEntry[] = (marks || []).map(
      (mark: {
        id: string;
        student_id: string;
        module_id: string;
        course_id: string;
        marks_obtained: number | null;
        total_marks: number | null;
        feedback: string | null;
        modules?: {
          module_id: string;
          module_name: string;
        } | null;
        courses?: {
          course_id: string;
          course_name: string;
          course_code: string;
        } | null;
      }) => ({
        id: mark.id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        course_id: mark.course_id,
        marks_obtained: mark.marks_obtained,
        total_marks: mark.total_marks,
        feedback: mark.feedback,
        module_name: mark.modules?.module_name || "Unknown Module",
        course_name: mark.courses?.course_name,
        course_code: mark.courses?.course_code,
      }),
    );

    return {
      success: true,
      marks: marksList,
    };
  } catch (error) {
    console.error("Unexpected error fetching child marks:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get modules for a course
 */
export async function getModulesForCourse(
  courseId: string,
): Promise<
  | {
      success: true;
      modules: Array<{
        module_id: string;
        module_name: string;
        total_marks: number;
      }>;
    }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
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
          error: "You do not have permission to view modules for this course.",
        };
      }
    }

    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("module_id, module_name, total_marks")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (modulesError) {
      console.error(
        "Error fetching modules:",
        JSON.stringify(modulesError, null, 2),
      );
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
        }) => ({
          module_id: m.module_id,
          module_name: m.module_name,
          total_marks: m.total_marks,
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
 * Get marks for a course (all modules, teacher only)
 */
export async function getMarksForCourse(
  courseId: string,
  moduleId?: string,
): Promise<
  | { success: true; marks: MarkEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view marks for a course.",
    };
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
        error: "You do not have permission to view marks for this course.",
      };
    }

    // Build query
    let query = supabase
      .from("marks")
      .select(`
        id,
        student_id,
        module_id,
        course_id,
        marks_obtained,
        total_marks,
        feedback,
        students!marks_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        ),
        modules!marks_module_id_fkey (
          module_id,
          module_name
        )
      `)
      .eq("course_id", courseId);

    if (moduleId) {
      query = query.eq("module_id", moduleId);
    }

    const { data: marks, error: marksError } = await query;

    if (marksError) {
      console.error("Error fetching marks:", JSON.stringify(marksError, null, 2));
      return {
        success: false,
        error: marksError.message || "Failed to fetch marks.",
      };
    }

    // Transform the data
    const marksList: MarkEntry[] = (marks || []).map(
      (mark: {
        id: string;
        student_id: string;
        module_id: string;
        course_id: string;
        marks_obtained: number | null;
        total_marks: number | null;
        feedback: string | null;
        students?: {
          id: string;
          registration_number: string | null;
          users?: {
            full_name: string | null;
          } | null;
        } | null;
        modules?: {
          module_id: string;
          module_name: string;
        } | null;
      }) => ({
        id: mark.id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        course_id: mark.course_id,
        marks_obtained: mark.marks_obtained,
        total_marks: mark.total_marks,
        feedback: mark.feedback,
        student_name: mark.students?.users?.full_name || "Unknown",
        registration_number: mark.students?.registration_number || null,
        module_name: mark.modules?.module_name || "Unknown Module",
      }),
    );

    return {
      success: true,
      marks: marksList,
    };
  } catch (error) {
    console.error("Unexpected error fetching marks:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

