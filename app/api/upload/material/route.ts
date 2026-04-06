import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "You must be logged in." }, { status: 401 });
    }

    if (session.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Only teachers can upload materials." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;

    if (!file) return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    if (!courseId) return NextResponse.json({ success: false, error: "Course ID is required." }, { status: 400 });

    const supabase = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "materials");

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket("materials", {
        public: true,
        allowedMimeTypes: null,
        fileSizeLimit: 52428800, // 50MB
      });
      if (createError) {
        return NextResponse.json(
          { success: false, error: `Could not create storage bucket: ${createError.message}` },
          { status: 500 },
        );
      }
    }

    const timestamp = Date.now();
    const filePath = `${courseId}/${timestamp}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const fileUrl = `/api/files?bucket=materials&path=${encodeURIComponent(filePath)}`;
    return NextResponse.json({ success: true, fileUrl, filePath });
  } catch (error) {
    console.error("Material upload error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
