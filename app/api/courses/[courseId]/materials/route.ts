import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { courseId } = await params;
  const supabase = createAdminClient();

  // Verify access
  if (session.role === "teacher") {
    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("course_id", courseId)
      .single();
    if (!course || (course as any).teacher_id !== session.userId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
  } else if (session.role === "student") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("student_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  } else {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("materials")
    .select("material_id, title, type, file_url, external_url")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data || [] });
}
