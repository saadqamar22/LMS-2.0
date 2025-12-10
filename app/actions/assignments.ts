"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface Assignment {
  assignment_id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  deadline: string;
  file_url: string | null;
  created_at: string | null;
  course_name?: string;
  course_code?: string;
}

export interface CreateAssignmentInput {
  courseId: string;
  title: string;
  description?: string;
  deadline: string; // ISO string
  fileUrl?: string; // Optional assignment file URL
}

/**
 * Update assignment file URL
 */
export async function updateAssignmentFileUrl(
  assignmentId: string,
  fileUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can update assignment files.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify assignment exists and teacher owns it
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("assignment_id, teacher_id")
      .eq("assignment_id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        success: false,
        error: "Assignment not found.",
      };
    }

    const assignmentInfo = assignment as { assignment_id: string; teacher_id: string };
    if (assignmentInfo.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to update this assignment.",
      };
    }

    // Get course_id for revalidation
    const { data: assignmentData } = await supabase
      .from("assignments")
      .select("course_id")
      .eq("assignment_id", assignmentId)
      .single();

    // Update assignment with file URL
    const updateQuery = supabase.from("assignments") as any;
    const { error: updateError } = await updateQuery
      .update({ file_url: fileUrl })
      .eq("assignment_id", assignmentId);

    if (updateError) {
      console.error(
        "Error updating assignment file URL:",
        JSON.stringify(updateError, null, 2),
      );
      return {
        success: false,
        error: updateError.message || "Failed to update assignment file URL.",
      };
    }

    // Revalidate all relevant paths
    const courseId = (assignmentData as { course_id: string } | null)?.course_id;
    if (courseId) {
      revalidatePath(`/teacher/courses/${courseId}/assignments`);
      revalidatePath(`/teacher/courses/${courseId}/assignments/${assignmentId}`);
      revalidatePath(`/student/courses/${courseId}/assignments`);
      revalidatePath(`/student/courses/${courseId}/assignments/${assignmentId}`);
      revalidatePath(`/teacher/assignments`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating assignment file URL:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Create a new assignment (teacher only)
 */
export async function createAssignment(
  input: CreateAssignmentInput,
): Promise<
  | { success: true; assignment: Assignment }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can create assignments.",
    };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "Assignment title is required." };
  }

  if (!input.deadline) {
    return { success: false, error: "Deadline is required." };
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

    const courseData = course as { course_id: string; teacher_id: string };
    if (courseData.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to create assignments for this course.",
      };
    }

    // Create assignment
    const insertQuery = supabase.from("assignments") as any;
    const { data: assignment, error: assignmentError } = await insertQuery
      .insert({
        course_id: input.courseId,
        teacher_id: session.userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        deadline: input.deadline,
        file_url: input.fileUrl?.trim() || null,
      })
      .select()
      .single();

    if (assignmentError) {
      console.error(
        "Error creating assignment:",
        JSON.stringify(assignmentError, null, 2),
      );
      return {
        success: false,
        error: assignmentError.message || "Failed to create assignment.",
      };
    }

    revalidatePath(`/teacher/courses/${input.courseId}/assignments`);
    revalidatePath(`/student/courses/${input.courseId}/assignments`);

    return {
      success: true,
      assignment: {
        assignment_id: assignment.assignment_id,
        course_id: assignment.course_id,
        teacher_id: assignment.teacher_id,
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline,
        file_url: assignment.file_url,
        created_at: assignment.created_at,
      },
    };
  } catch (error) {
    console.error("Unexpected error creating assignment:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get assignments for a course (teacher only)
 */
export async function getCourseAssignments(
  courseId: string,
): Promise<
  | { success: true; assignments: Assignment[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view course assignments.",
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

    const courseData = course as { course_id: string; teacher_id: string };
    if (courseData.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view assignments for this course.",
      };
    }

    // Fetch assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select(
        `
        assignment_id,
        course_id,
        teacher_id,
        title,
        description,
        deadline,
        file_url,
        created_at,
        courses!assignments_course_id_fkey (
          course_name,
          course_code
        )
      `,
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (assignmentsError) {
      console.error(
        "Error fetching assignments:",
        JSON.stringify(assignmentsError, null, 2),
      );
      return {
        success: false,
        error: assignmentsError.message || "Failed to fetch assignments.",
      };
    }

    const assignmentsList = (assignments || []).map((assignment) => ({
      assignment_id: assignment.assignment_id,
      course_id: assignment.course_id,
      teacher_id: assignment.teacher_id,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline,
      file_url: assignment.file_url,
      created_at: assignment.created_at,
      course_name:
        (assignment.courses as { course_name: string } | null)?.course_name ||
        null,
      course_code:
        (assignment.courses as { course_code: string } | null)?.course_code ||
        null,
    }));

    return {
      success: true,
      assignments: assignmentsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching assignments:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get assignments for a course (student - enrolled courses only)
 */
export async function getStudentCourseAssignments(
  courseId: string,
): Promise<
  | { success: true; assignments: Assignment[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view course assignments.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("course_id", courseId)
      .eq("student_id", session.userId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return {
        success: false,
        error: "You are not enrolled in this course.",
      };
    }

    // Fetch assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select(
        `
        assignment_id,
        course_id,
        teacher_id,
        title,
        description,
        deadline,
        file_url,
        created_at,
        courses!assignments_course_id_fkey (
          course_name,
          course_code
        )
      `,
      )
      .eq("course_id", courseId)
      .order("deadline", { ascending: true });

    if (assignmentsError) {
      console.error(
        "Error fetching assignments:",
        JSON.stringify(assignmentsError, null, 2),
      );
      return {
        success: false,
        error: assignmentsError.message || "Failed to fetch assignments.",
      };
    }

    const assignmentsList = (assignments || []).map((assignment) => ({
      assignment_id: assignment.assignment_id,
      course_id: assignment.course_id,
      teacher_id: assignment.teacher_id,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline,
      file_url: assignment.file_url,
      created_at: assignment.created_at,
      course_name:
        (assignment.courses as { course_name: string } | null)?.course_name ||
        null,
      course_code:
        (assignment.courses as { course_code: string } | null)?.course_code ||
        null,
    }));

    return {
      success: true,
      assignments: assignmentsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching assignments:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get a single assignment by ID
 */
export async function getAssignmentById(
  assignmentId: string,
): Promise<
  | { success: true; assignment: Assignment }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const supabase = createAdminClient();

    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select(
        `
        assignment_id,
        course_id,
        teacher_id,
        title,
        description,
        deadline,
        file_url,
        created_at,
        courses!assignments_course_id_fkey (
          course_name,
          course_code
        )
      `,
      )
      .eq("assignment_id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        success: false,
        error: "Assignment not found.",
      };
    }

    // Verify access: teacher must own the course, student must be enrolled
    if (session.role === "teacher") {
      const { data: course } = await supabase
        .from("courses")
        .select("teacher_id")
        .eq("course_id", assignment.course_id)
        .single();

      if (course?.teacher_id !== session.userId) {
        return {
          success: false,
          error: "You do not have permission to view this assignment.",
        };
      }
    } else if (session.role === "student") {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("enrollment_id")
        .eq("course_id", assignment.course_id)
        .eq("student_id", session.userId)
        .maybeSingle();

      if (!enrollment) {
        return {
          success: false,
          error: "You are not enrolled in this course.",
        };
      }
    } else {
      return {
        success: false,
        error: "You do not have permission to view assignments.",
      };
    }

    return {
      success: true,
      assignment: {
        assignment_id: assignment.assignment_id,
        course_id: assignment.course_id,
        teacher_id: assignment.teacher_id,
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline,
        file_url: assignment.file_url,
        created_at: assignment.created_at,
        course_name:
          (assignment.courses as { course_name: string } | null)?.course_name ||
          null,
        course_code:
          (assignment.courses as { course_code: string } | null)?.course_code ||
          null,
      },
    };
  } catch (error) {
    console.error("Unexpected error fetching assignment:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get all upcoming assignments for a student (across all enrolled courses)
 */
export async function getUpcomingAssignmentsForStudent(
  limit?: number,
): Promise<
  | { success: true; assignments: Assignment[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view upcoming assignments.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Get all enrolled course IDs
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", session.userId);

    if (enrollmentsError) {
      console.error(
        "Error fetching enrollments:",
        JSON.stringify(enrollmentsError, null, 2),
      );
      return {
        success: false,
        error: enrollmentsError.message || "Failed to fetch enrollments.",
      };
    }

    if (!enrollments || enrollments.length === 0) {
      return {
        success: true,
        assignments: [],
      };
    }

    const courseIds = enrollments.map((e) => e.course_id);
    const now = new Date().toISOString();

    // Fetch upcoming assignments (deadline in the future)
    const baseQuery = supabase
      .from("assignments")
      .select(
        `
        assignment_id,
        course_id,
        teacher_id,
        title,
        description,
        deadline,
        file_url,
        created_at,
        courses!assignments_course_id_fkey (
          course_name,
          course_code
        )
      `,
      )
      .in("course_id", courseIds)
      .gte("deadline", now)
      .order("deadline", { ascending: true });

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const { data: assignments, error: assignmentsError } = await query;

    if (assignmentsError) {
      console.error(
        "Error fetching upcoming assignments:",
        JSON.stringify(assignmentsError, null, 2),
      );
      return {
        success: false,
        error: assignmentsError.message || "Failed to fetch assignments.",
      };
    }

    const assignmentsList = (assignments || []).map((assignment) => ({
      assignment_id: assignment.assignment_id,
      course_id: assignment.course_id,
      teacher_id: assignment.teacher_id,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline,
      file_url: assignment.file_url,
      created_at: assignment.created_at,
      course_name:
        (assignment.courses as { course_name: string } | null)?.course_name ||
        null,
      course_code:
        (assignment.courses as { course_code: string } | null)?.course_code ||
        null,
    }));

    return {
      success: true,
      assignments: assignmentsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching upcoming assignments:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
