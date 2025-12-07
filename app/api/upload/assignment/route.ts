import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.role !== "teacher") {
      return NextResponse.json(
        { success: false, error: "Only teachers can upload assignment files." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const assignmentId = formData.get("assignmentId") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided." },
        { status: 400 },
      );
    }

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "Assignment ID is required." },
        { status: 400 },
      );
    }

    // Use admin client to bypass RLS (we've already validated the user's role)
    const supabase = createAdminClient();

    // Generate unique file path: assignments/{assignmentId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${assignmentId}/${fileName}`;

    // Check if bucket exists, create if it doesn't
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to access storage. Please check your Supabase configuration.",
        },
        { status: 500 },
      );
    }

    const bucketExists = buckets?.some((b) => b.name === "assignments");

    if (!bucketExists) {
      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket("assignments", {
        public: true,
        allowedMimeTypes: null,
        fileSizeLimit: 52428800, // 50MB
      });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return NextResponse.json(
          {
            success: false,
            error: `Bucket "assignments" does not exist and could not be created. Please create it manually in Supabase Storage. Error: ${createError.message}`,
          },
          { status: 500 },
        );
      }
    }

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: uploadError.message || "Failed to upload file.",
        },
        { status: 500 },
      );
    }

    // Use API route for file access instead of public URL
    const fileUrl = `/api/files?bucket=assignments&path=${encodeURIComponent(filePath)}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      filePath,
    });
  } catch (error) {
    console.error("Unexpected error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

