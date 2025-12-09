"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface CourseWithTeacher {
  course_id: string;
  course_name: string;
  course_code: string;
  teacher_id: string | null;
  created_at: string;
  teacher_name: string | null;
}

export interface Enrollment {
  enrollment_id: string;
  student_id: string;
  course_id: string;
}

/**
 * Get all available courses with teacher names for students to browse
 */
export async function getAvailableCourses(): Promise<
  | { success: true; courses: CourseWithTeacher[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const supabase = createAdminClient();

    // Fetch all courses with teacher information
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        course_id,
        course_name,
        course_code,
        teacher_id,
        created_at,
        teachers!courses_teacher_id_fkey (
          id,
          users!teachers_id_fkey (
            full_name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return {
        success: false,
        error: coursesError.message || "Failed to fetch courses.",
      };
    }

    // Transform the data to include teacher name
    const coursesWithTeacher: CourseWithTeacher[] = (courses || []).map(
      (course: {
        course_id: string;
        course_name: string;
        course_code: string;
        teacher_id: string | null;
        created_at: string;
        teachers?: {
          users?: { full_name: string | null };
        } | null;
      }) => ({
        course_id: course.course_id,
        course_name: course.course_name,
        course_code: course.course_code,
        teacher_id: course.teacher_id,
        created_at: course.created_at,
        teacher_name: course.teachers?.users?.full_name || null,
      }),
    );

    return {
      success: true,
      courses: coursesWithTeacher,
    };
  } catch (error) {
    console.error("Unexpected error fetching courses:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get courses that a student is enrolled in
 */
export async function getStudentEnrollments(): Promise<
  | { success: true; enrollments: Enrollment[]; courses: CourseWithTeacher[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view their enrollments.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Fetch enrollments with course and teacher info
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select(`
        enrollment_id,
        student_id,
        course_id,
        courses!enrollments_course_id_fkey (
          course_id,
          course_name,
          course_code,
          teacher_id,
          created_at,
          teachers!courses_teacher_id_fkey (
            id,
            users!teachers_id_fkey (
              full_name
            )
          )
        )
      `)
      .eq("student_id", session.userId)
      .order("enrollment_id", { ascending: false });

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", JSON.stringify(enrollmentsError, null, 2));
      return {
        success: false,
        error: enrollmentsError.message || "Failed to fetch enrollments.",
      };
    }

    // Transform the data
    const enrollmentList: Enrollment[] = [];
    const coursesList: CourseWithTeacher[] = [];

    (enrollments || []).forEach(
      (enrollment: {
        enrollment_id: string;
        student_id: string;
        course_id: string;
        courses?: {
          course_id: string;
          course_name: string;
          course_code: string;
          teacher_id: string | null;
          created_at: string;
          teachers?: {
            users?: { full_name: string | null };
          } | null;
        } | null;
      }) => {
        enrollmentList.push({
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
        });

        if (enrollment.courses) {
          coursesList.push({
            course_id: enrollment.courses.course_id,
            course_name: enrollment.courses.course_name,
            course_code: enrollment.courses.course_code,
            teacher_id: enrollment.courses.teacher_id,
            created_at: enrollment.courses.created_at,
            teacher_name: enrollment.courses.teachers?.users?.full_name || null,
          });
        }
      },
    );

    return {
      success: true,
      enrollments: enrollmentList,
      courses: coursesList,
    };
  } catch (error) {
    console.error("Unexpected error fetching enrollments:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Check if a student is enrolled in a course
 */
export async function isStudentEnrolled(
  courseId: string,
): Promise<{ enrolled: boolean } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return { success: false, error: "Only students can check enrollment." };
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("student_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking enrollment:", error);
      return {
        success: false,
        error: error.message || "Failed to check enrollment.",
      };
    }

    return { enrolled: !!data };
  } catch (error) {
    console.error("Unexpected error checking enrollment:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Enroll a student in a course
 */
export async function enrollInCourse(
  courseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in to enroll." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can enroll in courses.",
    };
  }

  if (!courseId?.trim()) {
    return { success: false, error: "Course ID is required." };
  }

  try {
    const supabase = createAdminClient();

    // Check if already enrolled
    const { data: existing, error: checkError } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("student_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking enrollment:", checkError);
      return {
        success: false,
        error: "Failed to check enrollment status.",
      };
    }

    if (existing) {
      return {
        success: false,
        error: "You are already enrolled in this course.",
      };
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("course_id", courseId)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Course not found.",
      };
    }

    // Create enrollment
    const { error: enrollError } = await supabase.from("enrollments").insert([
      {
        student_id: session.userId,
        course_id: courseId,
      },
    ]);

    if (enrollError) {
      console.error("Enrollment error:", JSON.stringify(enrollError, null, 2));
      
      // Handle unique constraint violation
      if (enrollError.code === "23505" || enrollError.message?.includes("unique constraint")) {
        return {
          success: false,
          error: "You are already enrolled in this course.",
        };
      }
      
      return {
        success: false,
        error: enrollError.message || "Failed to enroll in course.",
      };
    }

    revalidatePath("/student/courses");
    revalidatePath(`/student/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error enrolling:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get course details with modules and enrollment status for a student
 */
export async function getCourseDetailsForStudent(
  courseId: string,
): Promise<
  | {
      success: true;
      course: CourseWithTeacher;
      modules: Array<{
        module_id: string;
        module_name: string;
        total_marks: number;
        created_at: string | null;
      }>;
      isEnrolled: boolean;
    }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const supabase = createAdminClient();

    // Fetch course with teacher info
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(`
        course_id,
        course_name,
        course_code,
        teacher_id,
        created_at,
        teachers!courses_teacher_id_fkey (
          id,
          users!teachers_id_fkey (
            full_name
          )
        )
      `)
      .eq("course_id", courseId)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Course not found.",
      };
    }

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("module_id, module_name, total_marks, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      // Don't fail if modules can't be fetched, just return empty array
    }

    // Check enrollment status (only for students)
    let isEnrolled = false;
    if (session.role === "student") {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("enrollment_id")
        .eq("student_id", session.userId)
        .eq("course_id", courseId)
        .maybeSingle();

      isEnrolled = !!enrollment;
    }

    const courseData = course as {
      course_id: string;
      course_name: string;
      course_code: string;
      teacher_id: string | null;
      created_at: string;
      teachers?: {
        users?: { full_name: string | null };
      } | null;
    };

    return {
      success: true,
      course: {
        course_id: courseData.course_id,
        course_name: courseData.course_name,
        course_code: courseData.course_code,
        teacher_id: courseData.teacher_id,
        created_at: courseData.created_at,
        teacher_name: courseData.teachers?.users?.full_name || null,
      },
      modules: (modules || []).map(
        (m: {
          module_id: string;
          module_name: string;
          total_marks: number;
          created_at: string | null;
        }) => ({
          module_id: m.module_id,
          module_name: m.module_name,
          total_marks: m.total_marks,
          created_at: m.created_at,
        }),
      ),
      isEnrolled,
    };
  } catch (error) {
    console.error("Unexpected error fetching course details:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export interface EnrolledStudent {
  student_id: string;
  full_name: string;
  registration_number: string | null;
}

/**
 * Get enrolled students for a course (teacher only, with access control)
 */
export async function getEnrolledStudentsForCourse(
  courseId: string,
): Promise<
  | { success: true; students: EnrolledStudent[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view enrolled students.",
    };
  }

  try {
    const supabase = createAdminClient();

    // First, verify the course exists and the teacher owns it
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

    // Access control: ensure the teacher owns this course
    if (course.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view students for this course.",
      };
    }

    // Fetch enrollments with student and user information
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select(`
        student_id,
        students!enrollments_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        )
      `)
      .eq("course_id", courseId);

    if (enrollmentsError) {
      console.error(
        "Error fetching enrolled students:",
        JSON.stringify(enrollmentsError, null, 2),
      );
      return {
        success: false,
        error: enrollmentsError.message || "Failed to fetch enrolled students.",
      };
    }

    // Transform the data
    const students: EnrolledStudent[] = (enrollments || [])
      .map((enrollment: {
        student_id: string;
        students?: {
          id: string;
          registration_number: string | null;
          users?: {
            full_name: string | null;
          } | null;
        } | null;
      }) => {
        const studentData = enrollment.students;
        if (!studentData) {
          return null;
        }

        return {
          student_id: enrollment.student_id,
          full_name: studentData.users?.full_name || "Unknown",
          registration_number: studentData.registration_number,
        };
      })
      .filter((student): student is EnrolledStudent => student !== null);

    return {
      success: true,
      students,
    };
  } catch (error) {
    console.error("Unexpected error fetching enrolled students:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get enrollment count for a course (public - anyone can see how many students are enrolled)
 */
export async function getCourseEnrollmentCount(
  courseId: string,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const supabase = createAdminClient();

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("course_id", courseId)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Course not found.",
      };
    }

    // Count enrollments
    const { count, error: countError } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (countError) {
      console.error("Error counting enrollments:", countError);
      return {
        success: false,
        error: countError.message || "Failed to count enrollments.",
      };
    }

    return {
      success: true,
      count: count || 0,
    };
  } catch (error) {
    console.error("Unexpected error counting enrollments:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

