"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
}

export interface AttendanceEntry {
  attendance_id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: AttendanceStatus;
  student_name?: string;
  registration_number?: string | null;
  course_name?: string;
  course_code?: string;
}

export interface SaveAttendanceInput {
  courseId: string;
  date: string;
  records: AttendanceRecord[];
}

/**
 * Save attendance for a course on a specific date (teacher only)
 */
export async function saveAttendance(
  input: SaveAttendanceInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can mark attendance.",
    };
  }

  if (!input.courseId?.trim() || !input.date?.trim()) {
    return {
      success: false,
      error: "Course ID and date are required.",
    };
  }

  if (!input.records || input.records.length === 0) {
    return {
      success: false,
      error: "At least one attendance record is required.",
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

    const courseData = course as { course_id: string; teacher_id: string };
    if (courseData.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to mark attendance for this course.",
      };
    }

    // Validate date format
    const dateObj = new Date(input.date);
    if (isNaN(dateObj.getTime())) {
      return {
        success: false,
        error: "Invalid date format.",
      };
    }

    // Validate status values
    const validStatuses: AttendanceStatus[] = ["present", "absent", "late"];
    for (const record of input.records) {
      if (!validStatuses.includes(record.status)) {
        return {
          success: false,
          error: `Invalid status: ${record.status}. Must be present, absent, or late.`,
        };
      }
    }

    // Upsert attendance records (one per student)
    const attendanceData = input.records.map((record) => ({
      course_id: input.courseId,
      student_id: record.student_id,
      date: input.date,
      status: record.status,
    }));

    // Use upsert with conflict resolution
    // First, delete existing records for this date
    await supabase
      .from("attendance")
      .delete()
      .eq("course_id", input.courseId)
      .eq("date", input.date);

    // Then insert new records
    const insertQuery = supabase.from("attendance") as any;
    const { error: insertError } = await insertQuery.insert(attendanceData);

    if (insertError) {
      console.error("Error saving attendance:", JSON.stringify(insertError, null, 2));
      return {
        success: false,
        error: insertError.message || "Failed to save attendance.",
      };
    }

    revalidatePath(`/teacher/courses/${input.courseId}/attendance`);
    revalidatePath(`/student/attendance`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving attendance:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get attendance for a course on a specific date (teacher only)
 */
export async function getAttendanceForDate(
  courseId: string,
  date: string,
): Promise<
  | { success: true; attendance: AttendanceEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view attendance records.",
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
        error: "You do not have permission to view attendance for this course.",
      };
    }

    // Fetch attendance with student information
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select(`
        attendance_id,
        student_id,
        course_id,
        date,
        status,
        students!attendance_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        )
      `)
      .eq("course_id", courseId)
      .eq("date", date);

    if (attendanceError) {
      console.error(
        "Error fetching attendance:",
        JSON.stringify(attendanceError, null, 2),
      );
      return {
        success: false,
        error: attendanceError.message || "Failed to fetch attendance.",
      };
    }

    // Transform the data
    const attendanceList: AttendanceEntry[] = (attendance || [])
      .map(
        (entry: {
          attendance_id: string;
          student_id: string;
          course_id: string;
          date: string;
          status: AttendanceStatus;
          students?: {
            id: string;
            registration_number: string | null;
            users?: {
              full_name: string | null;
            } | null;
          } | null;
        }) => ({
          attendance_id: entry.attendance_id,
          student_id: entry.student_id,
          course_id: entry.course_id,
          date: entry.date,
          status: entry.status,
          student_name: entry.students?.users?.full_name || "Unknown",
          registration_number: entry.students?.registration_number || null,
        }),
      )
      .sort((a, b) => {
        const nameA = a.student_name || "";
        const nameB = b.student_name || "";
        return nameA.localeCompare(nameB);
      });

    return {
      success: true,
      attendance: attendanceList,
    };
  } catch (error) {
    console.error("Unexpected error fetching attendance:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get attendance history for a course (teacher only)
 */
export async function getAttendanceHistory(
  courseId: string,
): Promise<
  | { success: true; history: Array<{ date: string; count: number }> }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view attendance history.",
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
        error: "You do not have permission to view attendance history for this course.",
      };
    }

    // Fetch distinct dates with counts
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("date")
      .eq("course_id", courseId)
      .order("date", { ascending: false });

    if (attendanceError) {
      console.error(
        "Error fetching attendance history:",
        JSON.stringify(attendanceError, null, 2),
      );
      return {
        success: false,
        error: attendanceError.message || "Failed to fetch attendance history.",
      };
    }

    // Group by date and count
    const dateMap = new Map<string, number>();
    (attendance || []).forEach((entry) => {
      const count = dateMap.get(entry.date) || 0;
      dateMap.set(entry.date, count + 1);
    });

    const history = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      success: true,
      history,
    };
  } catch (error) {
    console.error("Unexpected error fetching attendance history:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get student's attendance for a course (student only)
 */
export async function getStudentAttendance(
  courseId?: string,
): Promise<
  | { success: true; attendance: AttendanceEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view their own attendance.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("attendance")
      .select(`
        attendance_id,
        student_id,
        course_id,
        date,
        status,
        courses!attendance_course_id_fkey (
          course_id,
          course_name,
          course_code
        )
      `)
      .eq("student_id", session.userId)
      .order("date", { ascending: false });

    // Filter by course if provided
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: attendance, error: attendanceError } = await query;

    if (attendanceError) {
      console.error(
        "Error fetching student attendance:",
        JSON.stringify(attendanceError, null, 2),
      );
      return {
        success: false,
        error: attendanceError.message || "Failed to fetch attendance.",
      };
    }

    // Transform the data
    const attendanceList: AttendanceEntry[] = (attendance || []).map(
      (entry: {
        attendance_id: string;
        student_id: string;
        course_id: string;
        date: string;
        status: AttendanceStatus;
        courses?: {
          course_id: string;
          course_name: string;
          course_code: string;
        } | null;
      }) => ({
        attendance_id: entry.attendance_id,
        student_id: entry.student_id,
        course_id: entry.course_id,
        date: entry.date,
        status: entry.status,
        course_name: entry.courses?.course_name,
        course_code: entry.courses?.course_code,
        student_name: undefined, // Not needed for student view
        registration_number: undefined, // Not needed for student view
      }),
    );

    return {
      success: true,
      attendance: attendanceList,
    };
  } catch (error) {
    console.error("Unexpected error fetching student attendance:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get attendance for a child (parent only)
 */
export async function getChildAttendance(
  childId: string,
  courseId?: string,
): Promise<
  | { success: true; attendance: AttendanceEntry[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "parent") {
    return {
      success: false,
      error: "Only parents can view their children's attendance.",
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
        error: "You do not have permission to view this student's attendance.",
      };
    }

    // Build query
    let query = supabase
      .from("attendance")
      .select(`
        attendance_id,
        student_id,
        course_id,
        date,
        status,
        courses!attendance_course_id_fkey (
          course_id,
          course_name,
          course_code
        )
      `)
      .eq("student_id", childId)
      .order("date", { ascending: false });

    // Filter by course if provided
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: attendance, error: attendanceError } = await query;

    if (attendanceError) {
      console.error(
        "Error fetching child attendance:",
        JSON.stringify(attendanceError, null, 2),
      );
      return {
        success: false,
        error: attendanceError.message || "Failed to fetch attendance.",
      };
    }

    // Transform the data
    const attendanceList: AttendanceEntry[] = (attendance || []).map(
      (entry: {
        attendance_id: string;
        student_id: string;
        course_id: string;
        date: string;
        status: AttendanceStatus;
        courses?: {
          course_id: string;
          course_name: string;
          course_code: string;
        } | null;
      }) => ({
        attendance_id: entry.attendance_id,
        student_id: entry.student_id,
        course_id: entry.course_id,
        date: entry.date,
        status: entry.status,
        course_name: entry.courses?.course_name,
        course_code: entry.courses?.course_code,
        student_name: undefined, // Not needed for parent view
        registration_number: undefined, // Not needed for parent view
      }),
    );

    return {
      success: true,
      attendance: attendanceList,
    };
  } catch (error) {
    console.error("Unexpected error fetching child attendance:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

