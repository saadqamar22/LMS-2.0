import { NextResponse } from "next/server";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: "Course ID is required." },
      { status: 400 },
    );
  }

  const result = await getEnrolledStudentsForCourse(courseId);
  return NextResponse.json(result);
}

