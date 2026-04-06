import { NextResponse } from "next/server";
import { getMarksForModule } from "@/app/actions/marks";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const moduleId = searchParams.get("moduleId");

  if (!courseId || !moduleId) {
    return NextResponse.json(
      { success: false, error: "Course ID and Module ID are required." },
      { status: 400 },
    );
  }

  const result = await getMarksForModule(courseId, moduleId);
  return NextResponse.json(result);
}

