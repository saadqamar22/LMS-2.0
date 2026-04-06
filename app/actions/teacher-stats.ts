"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  recentCourses: Array<{
    course_id: string;
    course_name: string;
    course_code: string;
    student_count: number;
  }>;
}

/**
 * Get teacher statistics for dashboard
 */
export async function getTeacherStats(): Promise<
  | { success: true; stats: TeacherStats }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view teacher statistics.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Get total courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("teacher_id", session.userId);

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return {
        success: false,
        error: coursesError.message || "Failed to fetch courses.",
      };
    }

    const courseIds = ((courses || []) as Array<{ course_id: string }>).map((c) => c.course_id);
    const totalCourses = courseIds.length;

    // Get total unique students across all courses
    let enrollments: any[] = [];
    if (courseIds.length > 0) {
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("student_id")
        .in("course_id", courseIds);

      if (enrollmentsError) {
        console.error("Error fetching enrollments:", JSON.stringify(enrollmentsError, null, 2));
        // Continue even if error, just set to empty array
      } else {
        enrollments = enrollmentsData || [];
      }
    }

    const uniqueStudents = new Set(
      enrollments.map((e) => e.student_id),
    );
    const totalStudents = uniqueStudents.size;

    // Get recent courses with student counts
    const { data: recentCoursesData, error: recentCoursesError } = await supabase
      .from("courses")
      .select("course_id, course_name, course_code")
      .eq("teacher_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentCoursesError) {
      console.error("Error fetching recent courses:", recentCoursesError);
    }

    const recentCoursesList = ((recentCoursesData || []) as Array<{
      course_id: string;
      course_name: string;
      course_code: string;
    }>);
    const recentCourseIds = recentCoursesList.map((c) => c.course_id);

    // Get student counts for each course
    let enrollmentCounts: any[] = [];
    if (recentCourseIds.length > 0) {
      const { data: enrollmentCountsData } = await supabase
        .from("enrollments")
        .select("course_id")
        .in("course_id", recentCourseIds);
      
      enrollmentCounts = ((enrollmentCountsData || []) as Array<{ course_id: string }>);
    }

    const countsByCourse = new Map<string, number>();
    enrollmentCounts.forEach((e) => {
      const count = countsByCourse.get(e.course_id) || 0;
      countsByCourse.set(e.course_id, count + 1);
    });

    const recentCourses = recentCoursesList.map((course) => ({
      course_id: course.course_id,
      course_name: course.course_name,
      course_code: course.course_code,
      student_count: countsByCourse.get(course.course_id) || 0,
    }));

    return {
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        recentCourses,
      },
    };
  } catch (error) {
    console.error("Unexpected error fetching teacher stats:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

