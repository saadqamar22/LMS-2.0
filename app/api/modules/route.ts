import { NextResponse } from "next/server";
import { getModulesForCourse } from "@/app/actions/modules";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: "Course ID is required." },
      { status: 400 },
    );
  }

  const result = await getModulesForCourse(courseId);
  return NextResponse.json(result);
}

