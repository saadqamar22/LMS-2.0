"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface MarkEntry {
  mark_id: string;
  student_id: string;
  module_id: string;
  obtained_marks: number;
  average: number | null;
  std_deviation: number | null;
  min_marks: number | null;
  max_marks: number | null;
  median_marks: number | null;
  student_name?: string;
  registration_number?: string | null;
  module_name?: string;
  module_total_marks?: number;
  course_name?: string;
  course_code?: string;
}

export interface SaveMarkInput {
  moduleId: string;
  studentId: string;
  obtainedMarks: number;
}

export interface ModuleStatistics {
  module_id: string;
  module_name: string;
  average: number;
  stdDeviation: number;
  minMarks: number;
  maxMarks: number;
  medianMarks: number;
  totalMarks: number;
}

export interface CourseStatistics {
  courseAverage: number;
  courseStdDeviation: number;
  moduleStats: ModuleStatistics[];
}

/**
 * Calculate statistics for a module
 */
function calculateStatistics(marks: number[]): {
  average: number;
  stdDeviation: number;
  minMarks: number;
  maxMarks: number;
  medianMarks: number;
} {
  if (marks.length === 0) {
    return {
      average: 0,
      stdDeviation: 0,
      minMarks: 0,
      maxMarks: 0,
      medianMarks: 0,
    };
  }

  const sorted = [...marks].sort((a, b) => a - b);
  const sum = marks.reduce((acc, val) => acc + val, 0);
  const average = sum / marks.length;
  const variance =
    marks.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) /
    marks.length;
  const stdDeviation = Math.sqrt(variance);
  const minMarks = sorted[0];
  const maxMarks = sorted[sorted.length - 1];
  const medianMarks =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return {
    average: Math.round(average * 100) / 100,
    stdDeviation: Math.round(stdDeviation * 100) / 100,
    minMarks,
    maxMarks,
    medianMarks: Math.round(medianMarks * 100) / 100,
  };
}

/**
 * Update statistics for a module
 */
async function updateModuleStatistics(moduleId: string): Promise<void> {
  const supabase = createAdminClient();

  // Fetch all marks for this module
  const { data: marks, error: marksError } = await supabase
    .from("marks")
    .select("obtained_marks")
    .eq("module_id", moduleId);

  if (marksError || !marks || marks.length === 0) {
    return;
  }

  const marksArray = ((marks || []) as Array<{ obtained_marks: number }>).map((m) => m.obtained_marks);
  const stats = calculateStatistics(marksArray);

  // Update all marks in this module with the same statistics
  const updateQuery = supabase.from("marks") as any;
  await updateQuery
    .update({
      average: stats.average,
      std_deviation: stats.stdDeviation,
      min_marks: stats.minMarks,
      max_marks: stats.maxMarks,
      median_marks: stats.medianMarks,
    })
    .eq("module_id", moduleId);
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

  if (!input.moduleId || !input.studentId) {
    return {
      success: false,
      error: "Module and student are required.",
    };
  }

  if (input.obtainedMarks < 0) {
    return {
      success: false,
      error: "Marks obtained must be >= 0.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify module exists and get course info
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select("module_id, course_id, total_marks, courses!inner(teacher_id)")
      .eq("module_id", input.moduleId)
      .single();

    if (moduleError || !module) {
      return {
        success: false,
        error: "Module not found.",
      };
    }

    const moduleData = module as {
      module_id: string;
      course_id: string;
      total_marks: number;
      courses: { teacher_id: string };
    };
    const courseData = moduleData.courses;
    if (courseData.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to enter marks for this module.",
      };
    }

    // Verify obtained marks don't exceed total marks
    if (input.obtainedMarks > moduleData.total_marks) {
      return {
        success: false,
        error: `Marks obtained (${input.obtainedMarks}) cannot exceed total marks (${moduleData.total_marks}).`,
      };
    }

    // Upsert mark
    const upsertQuery = supabase.from("marks") as any;
    const { error: markError } = await upsertQuery.upsert(
      {
        student_id: input.studentId,
        module_id: input.moduleId,
        obtained_marks: input.obtainedMarks,
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

    // Update statistics for this module
    await updateModuleStatistics(input.moduleId);

    revalidatePath(`/teacher/courses/${moduleData.course_id}/marks`);
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
 * Get marks for a module (teacher only)
 */
export async function getMarksForModule(
  courseId: string,
  moduleId: string,
): Promise<
  | { success: true; marks: MarkEntry[]; statistics: ModuleStatistics | null }
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

    const courseData = course as { course_id: string; teacher_id: string };
    if (courseData.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view marks for this course.",
      };
    }

    // Fetch marks with student and module info
    const { data: marks, error: marksError } = await supabase
      .from("marks")
      .select(`
        mark_id,
        student_id,
        module_id,
        obtained_marks,
        students!marks_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        ),
        modules!marks_module_id_fkey (
          module_id,
          module_name,
          total_marks
        )
      `)
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
        mark_id: string;
        student_id: string;
        module_id: string;
        obtained_marks: number;
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
          total_marks: number;
        } | null;
      }) => ({
        mark_id: mark.mark_id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        obtained_marks: mark.obtained_marks,
        average: null,
        std_deviation: null,
        min_marks: null,
        max_marks: null,
        median_marks: null,
        student_name: mark.students?.users?.full_name || "Unknown",
        registration_number: mark.students?.registration_number || null,
        module_name: mark.modules?.module_name || "Unknown Module",
        module_total_marks: mark.modules?.total_marks,
      }),
    );

    // Calculate statistics from marks data
    const marksArray = marksList.map((m) => m.obtained_marks);
    const stats = calculateStatistics(marksArray);
    
    // Update statistics in database
    if (marksList.length > 0) {
      await updateModuleStatistics(moduleId);
    }

    const statistics: ModuleStatistics | null =
      marksList.length > 0
        ? {
            module_id: moduleId,
            module_name: marksList[0].module_name || "Unknown",
            average: stats.average,
            stdDeviation: stats.stdDeviation,
            minMarks: stats.minMarks,
            maxMarks: stats.maxMarks,
            medianMarks: stats.medianMarks,
            totalMarks: marksList[0].module_total_marks || 0,
          }
        : null;

    return {
      success: true,
      marks: marksList.sort((a, b) => {
        const nameA = a.student_name || "";
        const nameB = b.student_name || "";
        return nameA.localeCompare(nameB);
      }),
      statistics,
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
 * Get course-wide statistics
 */
export async function getCourseStatistics(
  courseId: string,
): Promise<
  | { success: true; statistics: CourseStatistics }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view course statistics.",
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
        error: "You do not have permission to view statistics for this course.",
      };
    }

    // Get all modules for this course
    const { data: courseModules, error: modulesError } = await supabase
      .from("modules")
      .select("module_id, module_name, total_marks")
      .eq("course_id", courseId);

    if (modulesError) {
      return {
        success: false,
        error: "Failed to fetch modules.",
      };
    }

    const moduleStats: ModuleStatistics[] = [];
    const allMarks: number[] = [];

    // Get statistics for each module
    const modulesList = ((courseModules || []) as Array<{
      module_id: string;
      module_name: string;
      total_marks: number;
    }>);
    for (const courseModule of modulesList) {
      const { data: marks } = await supabase
        .from("marks")
        .select("obtained_marks, average, std_deviation, min_marks, max_marks, median_marks")
        .eq("module_id", courseModule.module_id)
        .limit(1);

      if (marks && marks.length > 0 && marks[0].average !== null) {
        const mark = marks[0];
        moduleStats.push({
          module_id: courseModule.module_id,
          module_name: courseModule.module_name,
          average: mark.average,
          stdDeviation: mark.std_deviation || 0,
          minMarks: mark.min_marks || 0,
          maxMarks: mark.max_marks || 0,
          medianMarks: mark.median_marks || 0,
          totalMarks: courseModule.total_marks,
        });

        // Collect all marks for course-wide average
        const { data: allModuleMarks } = await supabase
          .from("marks")
          .select("obtained_marks")
          .eq("module_id", courseModule.module_id);

        if (allModuleMarks) {
          allMarks.push(...allModuleMarks.map((m) => m.obtained_marks));
        }
      }
    }

    // Calculate course-wide statistics
    const courseStats = calculateStatistics(allMarks);

    return {
      success: true,
      statistics: {
        courseAverage: courseStats.average,
        courseStdDeviation: courseStats.stdDeviation,
        moduleStats,
      },
    };
  } catch (error) {
    console.error("Unexpected error fetching course statistics:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get module statistics for a student (student only)
 */
export async function getStudentModuleStatistics(
  moduleId: string,
): Promise<
  | { success: true; statistics: ModuleStatistics | null }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view module statistics.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Fetch all marks for this module
    const { data: marks, error: marksError } = await supabase
      .from("marks")
      .select(`
        obtained_marks,
        modules!marks_module_id_fkey (
          module_id,
          module_name,
          total_marks
        )
      `)
      .eq("module_id", moduleId);

    if (marksError) {
      console.error(
        "Error fetching module statistics:",
        JSON.stringify(marksError, null, 2),
      );
      return {
        success: false,
        error: marksError.message || "Failed to fetch statistics.",
      };
    }

    if (!marks || marks.length === 0) {
      return {
        success: true,
        statistics: null,
      };
    }

    const marksArray = marks.map((m) => m.obtained_marks);
    const stats = calculateStatistics(marksArray);
    const moduleData = marks[0].modules as {
      module_id: string;
      module_name: string;
      total_marks: number;
    } | null;

    return {
      success: true,
      statistics: moduleData
        ? {
            module_id: moduleId,
            module_name: moduleData.module_name,
            average: stats.average,
            stdDeviation: stats.stdDeviation,
            minMarks: stats.minMarks,
            maxMarks: stats.maxMarks,
            medianMarks: stats.medianMarks,
            totalMarks: moduleData.total_marks,
          }
        : null,
    };
  } catch (error) {
    console.error("Unexpected error fetching module statistics:", error);
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
        mark_id,
        student_id,
        module_id,
        obtained_marks,
        modules!marks_module_id_fkey (
          module_id,
          module_name,
          total_marks,
          courses!inner (
            course_id,
            course_name,
            course_code
          )
        )
      `)
      .eq("student_id", session.userId);

    if (courseId) {
      query = query.eq("modules.courses.course_id", courseId);
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
        mark_id: string;
        student_id: string;
        module_id: string;
        obtained_marks: number;
        modules?: {
          module_id: string;
          module_name: string;
          total_marks: number;
          courses?: {
            course_id: string;
            course_name: string;
            course_code: string;
          } | null;
        } | null;
      }) => ({
        mark_id: mark.mark_id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        obtained_marks: mark.obtained_marks,
        module_name: mark.modules?.module_name || "Unknown Module",
        module_total_marks: mark.modules?.total_marks,
        course_name: mark.modules?.courses?.course_name,
        course_code: mark.modules?.courses?.course_code,
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
        mark_id,
        student_id,
        module_id,
        obtained_marks,
        modules!marks_module_id_fkey (
          module_id,
          module_name,
          total_marks,
          courses!inner (
            course_id,
            course_name,
            course_code
          )
        )
      `)
      .eq("student_id", childId);

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
        mark_id: string;
        student_id: string;
        module_id: string;
        obtained_marks: number;
        modules?: {
          module_id: string;
          module_name: string;
          total_marks: number;
          courses?: {
            course_id: string;
            course_name: string;
            course_code: string;
          } | null;
        } | null;
      }) => ({
        mark_id: mark.mark_id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        obtained_marks: mark.obtained_marks,
        module_name: mark.modules?.module_name || "Unknown Module",
        module_total_marks: mark.modules?.total_marks,
        course_name: mark.modules?.courses?.course_name,
        course_code: mark.modules?.courses?.course_code,
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
 * Get marks for a course (all modules, teacher only) - for compatibility
 */
export async function getMarksForCourse(
  courseId: string,
  moduleId?: string,
): Promise<
  | { success: true; marks: MarkEntry[] }
  | { success: false; error: string }
> {
  if (moduleId) {
    const result = await getMarksForModule(courseId, moduleId);
    if (!result.success) {
      return result;
    }
    return {
      success: true,
      marks: result.marks,
    };
  }

  // If no moduleId, get all marks for the course
  return getAllMarksForCourse(courseId);
}

/**
 * Get all marks for a course (teacher only)
 */
export async function getAllMarksForCourse(
  courseId: string,
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

    const courseData = course as { course_id: string; teacher_id: string };
    if (courseData.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view marks for this course.",
      };
    }

    // Get all modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("module_id")
      .eq("course_id", courseId);

    if (modulesError) {
      return {
        success: false,
        error: "Failed to fetch modules.",
      };
    }

    if (!modules || modules.length === 0) {
      return {
        success: true,
        marks: [],
      };
    }

    const moduleIds = modules.map((m) => m.module_id);

    // Fetch all marks for all modules in this course
    const { data: marks, error: marksError } = await supabase
      .from("marks")
      .select(`
        mark_id,
        student_id,
        module_id,
        obtained_marks,
        students!marks_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        ),
        modules!marks_module_id_fkey (
          module_id,
          module_name,
          total_marks,
          courses!inner (
            course_id,
            course_name,
            course_code
          )
        )
      `)
      .in("module_id", moduleIds);

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
        mark_id: string;
        student_id: string;
        module_id: string;
        obtained_marks: number;
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
          total_marks: number;
          courses?: {
            course_id: string;
            course_name: string;
            course_code: string;
          } | null;
        } | null;
      }) => ({
        mark_id: mark.mark_id,
        student_id: mark.student_id,
        module_id: mark.module_id,
        obtained_marks: mark.obtained_marks,
        average: null,
        std_deviation: null,
        min_marks: null,
        max_marks: null,
        median_marks: null,
        student_name: mark.students?.users?.full_name || "Unknown",
        registration_number: mark.students?.registration_number || null,
        module_name: mark.modules?.module_name || "Unknown Module",
        module_total_marks: mark.modules?.total_marks,
        course_name: mark.modules?.courses?.course_name,
        course_code: mark.modules?.courses?.course_code,
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
