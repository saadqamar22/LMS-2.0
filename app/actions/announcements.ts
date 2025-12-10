"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export type AnnouncementAudience = "students" | "parents" | "both";

export interface Announcement {
  announcement_id: string;
  teacher_id: string;
  course_id: string | null;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  created_at: string;
  teacher_name?: string;
  course_name?: string;
  course_code?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  course_id?: string | null; // null means "All Students"
  is_all_students?: boolean; // true means announcement for all students regardless of course
}

/**
 * Create a new announcement (teacher only)
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can create announcements.",
    };
  }

  if (!input.title?.trim()) {
    return {
      success: false,
      error: "Title is required.",
    };
  }

  if (!input.content?.trim()) {
    return {
      success: false,
      error: "Content is required.",
    };
  }

  if (!input.audience || !["students", "parents", "both"].includes(input.audience)) {
    return {
      success: false,
      error: "Invalid audience. Must be 'students', 'parents', or 'both'.",
    };
  }

  // Validate course_id if provided
  if (input.course_id && !input.is_all_students) {
    // Verify the course belongs to this teacher
    const supabase = createAdminClient();
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("course_id, teacher_id")
      .eq("course_id", input.course_id)
      .eq("teacher_id", session.userId)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Invalid course. You can only create announcements for your own courses.",
      };
    }
  }

  try {
    const supabase = createAdminClient();

    const insertData = {
      teacher_id: session.userId,
      course_id: input.is_all_students ? null : input.course_id || null,
      title: input.title.trim(),
      content: input.content.trim(),
      audience: input.audience,
    };

    const { error: insertError } = await supabase
      .from("announcements")
      .insert(insertData as any);

    if (insertError) {
      console.error("Error creating announcement:", JSON.stringify(insertError, null, 2));
      return {
        success: false,
        error: insertError.message || "Failed to create announcement.",
      };
    }

    revalidatePath("/teacher/announcements");
    revalidatePath("/student/announcements");
    revalidatePath("/parent/announcements");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error creating announcement:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get all announcements for students
 */
export async function getStudentAnnouncements(): Promise<
  | { success: true; announcements: Announcement[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view student announcements.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Get student's enrolled courses
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", session.userId);

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return {
        success: false,
        error: "Failed to fetch course enrollments.",
      };
    }

    const enrolledCourseIds = ((enrollments || []) as Array<{ course_id: string }>).map(e => e.course_id);

    // Get announcements: either course_id is null (all students) or matches enrolled courses
    // We need to get all announcements first, then filter in JavaScript
    const { data: allAnnouncements, error: announcementsError } = await supabase
      .from("announcements")
      .select(`
        announcement_id,
        teacher_id,
        course_id,
        title,
        content,
        audience,
        created_at
      `)
      .or("audience.eq.students,audience.eq.both")
      .order("created_at", { ascending: false });

    if (announcementsError) {
      console.error(
        "Error fetching student announcements:",
        JSON.stringify(announcementsError, null, 2),
      );
      return {
        success: false,
        error: announcementsError.message || "Failed to fetch announcements.",
      };
    }

    // Filter announcements: course_id is null (all students) OR course_id is in enrolled courses
    const announcements = ((allAnnouncements || []) as Array<{
      announcement_id: string;
      teacher_id: string;
      course_id: string | null;
      title: string;
      content: string;
      audience: string;
      created_at: string | null;
    }>).filter(
      (announcement) =>
        announcement.course_id === null ||
        (enrolledCourseIds.length > 0 && enrolledCourseIds.includes(announcement.course_id))
    );

    // Get teacher names and course names
    const teacherIds = [...new Set((announcements || []).map(a => a.teacher_id))];
    const courseIds = [...new Set((announcements || [])
      .map(a => a.course_id)
      .filter((id): id is string => id !== null))];

    const [teachersResult, coursesResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name")
        .in("id", teacherIds),
      courseIds.length > 0
        ? supabase
            .from("courses")
            .select("course_id, course_name, course_code")
            .in("course_id", courseIds)
        : { data: [], error: null },
    ]);

    const teacherMap = new Map(
      ((teachersResult.data || []) as Array<{ id: string; full_name: string | null }>).map(t => [t.id, t.full_name || "Unknown Teacher"])
    );

    const courseMap = new Map(
      ((coursesResult.data || []) as Array<{ course_id: string; course_name: string; course_code: string }>).map(c => [
        c.course_id,
        { name: c.course_name, code: c.course_code },
      ])
    );

    const announcementsList: Announcement[] = (announcements || []).map(
      (announcement) => ({
        announcement_id: announcement.announcement_id,
        teacher_id: announcement.teacher_id,
        course_id: announcement.course_id,
        title: announcement.title,
        content: announcement.content,
        audience: announcement.audience as AnnouncementAudience,
        created_at: announcement.created_at || "",
        teacher_name: teacherMap.get(announcement.teacher_id) || "Unknown Teacher",
        course_name: announcement.course_id
          ? courseMap.get(announcement.course_id)?.name
          : undefined,
        course_code: announcement.course_id
          ? courseMap.get(announcement.course_id)?.code
          : undefined,
      }),
    );

    return {
      success: true,
      announcements: announcementsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching student announcements:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get all announcements for parents
 */
export async function getParentAnnouncements(): Promise<
  | { success: true; announcements: Announcement[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "parent") {
    return {
      success: false,
      error: "Only parents can view parent announcements.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Get parent's children
    const { data: children, error: childrenError } = await supabase
      .from("students")
      .select("id")
      .eq("parent_id", session.userId);

    if (childrenError) {
      console.error("Error fetching children:", childrenError);
      return {
        success: false,
        error: "Failed to fetch children information.",
      };
    }

    const childIds = ((children || []) as Array<{ id: string }>).map(c => c.id);

    if (childIds.length === 0) {
      // No children, return empty list
      return {
        success: true,
        announcements: [],
      };
    }

    // Get courses that children are enrolled in
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("student_id", childIds);

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return {
        success: false,
        error: "Failed to fetch course enrollments.",
      };
    }

    const enrolledCourseIds = [...new Set(((enrollments || []) as Array<{ course_id: string }>).map(e => e.course_id))];

    // Get announcements: either course_id is null (all students) or matches children's enrolled courses
    // We need to get all announcements first, then filter in JavaScript
    const { data: allAnnouncements, error: announcementsError } = await supabase
      .from("announcements")
      .select(`
        announcement_id,
        teacher_id,
        course_id,
        title,
        content,
        audience,
        created_at
      `)
      .or("audience.eq.parents,audience.eq.both")
      .order("created_at", { ascending: false });

    if (announcementsError) {
      console.error(
        "Error fetching parent announcements:",
        JSON.stringify(announcementsError, null, 2),
      );
      return {
        success: false,
        error: announcementsError.message || "Failed to fetch announcements.",
      };
    }

    // Filter announcements: course_id is null (all students) OR course_id is in enrolled courses
    const announcements = ((allAnnouncements || []) as Array<{
      announcement_id: string;
      teacher_id: string;
      course_id: string | null;
      title: string;
      content: string;
      audience: string;
      created_at: string | null;
    }>).filter(
      (announcement) =>
        announcement.course_id === null ||
        (enrolledCourseIds.length > 0 && enrolledCourseIds.includes(announcement.course_id))
    );

    // Get teacher names and course names
    const teacherIds = [...new Set((announcements || []).map(a => a.teacher_id))];
    const courseIds = [...new Set((announcements || [])
      .map(a => a.course_id)
      .filter((id): id is string => id !== null))];

    const [teachersResult, coursesResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name")
        .in("id", teacherIds),
      courseIds.length > 0
        ? supabase
            .from("courses")
            .select("course_id, course_name, course_code")
            .in("course_id", courseIds)
        : { data: [], error: null },
    ]);

    const teacherMap = new Map(
      ((teachersResult.data || []) as Array<{ id: string; full_name: string | null }>).map(t => [t.id, t.full_name || "Unknown Teacher"])
    );

    const courseMap = new Map(
      ((coursesResult.data || []) as Array<{ course_id: string; course_name: string; course_code: string }>).map(c => [
        c.course_id,
        { name: c.course_name, code: c.course_code },
      ])
    );

    const announcementsList: Announcement[] = (announcements || []).map(
      (announcement) => ({
        announcement_id: announcement.announcement_id,
        teacher_id: announcement.teacher_id,
        course_id: announcement.course_id,
        title: announcement.title,
        content: announcement.content,
        audience: announcement.audience as AnnouncementAudience,
        created_at: announcement.created_at || "",
        teacher_name: teacherMap.get(announcement.teacher_id) || "Unknown Teacher",
        course_name: announcement.course_id
          ? courseMap.get(announcement.course_id)?.name
          : undefined,
        course_code: announcement.course_id
          ? courseMap.get(announcement.course_id)?.code
          : undefined,
      }),
    );

    return {
      success: true,
      announcements: announcementsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching parent announcements:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get all announcements for teachers (their own announcements)
 */
export async function getTeacherAnnouncements(): Promise<
  | { success: true; announcements: Announcement[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view their announcements.",
    };
  }

  try {
    const supabase = createAdminClient();

    // First get announcements
    const { data: announcements, error: announcementsError } = await supabase
      .from("announcements")
      .select(`
        announcement_id,
        teacher_id,
        course_id,
        title,
        content,
        audience,
        created_at
      `)
      .eq("teacher_id", session.userId)
      .order("created_at", { ascending: false });

    if (announcementsError) {
      console.error(
        "Error fetching teacher announcements:",
        JSON.stringify(announcementsError, null, 2),
      );
      return {
        success: false,
        error: announcementsError.message || "Failed to fetch announcements.",
      };
    }

    // Get teacher name
    const { data: teacher } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("id", session.userId)
      .single();

    const teacherName = (teacher as { id: string; full_name: string | null } | null)?.full_name || "Unknown Teacher";

    // Get course names for course-specific announcements
    const courseIds = [...new Set((announcements || [])
      .map(a => a.course_id)
      .filter((id): id is string => id !== null))];

    const { data: courses } = courseIds.length > 0
      ? await supabase
          .from("courses")
          .select("course_id, course_name, course_code")
          .in("course_id", courseIds)
      : { data: [], error: null };

    const courseMap = new Map(
      (courses || []).map(c => [
        c.course_id,
        { name: c.course_name, code: c.course_code },
      ])
    );

    const announcementsList: Announcement[] = (announcements || []).map(
      (announcement) => ({
        announcement_id: announcement.announcement_id,
        teacher_id: announcement.teacher_id,
        course_id: announcement.course_id,
        title: announcement.title,
        content: announcement.content,
        audience: announcement.audience as AnnouncementAudience,
        created_at: announcement.created_at || "",
        teacher_name: teacherName,
        course_name: announcement.course_id
          ? courseMap.get(announcement.course_id)?.name
          : undefined,
        course_code: announcement.course_id
          ? courseMap.get(announcement.course_id)?.code
          : undefined,
      }),
    );

    return {
      success: true,
      announcements: announcementsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching teacher announcements:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}


