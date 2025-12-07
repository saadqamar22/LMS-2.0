import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";

/**
 * Serve files from Supabase Storage with proper authentication
 * GET /api/files?bucket=assignments&path=xxx or /api/files?bucket=submissions&path=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const filePath = searchParams.get("path");

    if (!bucket || !filePath) {
      return NextResponse.json(
        { success: false, error: "Bucket and path are required." },
        { status: 400 },
      );
    }

    if (bucket !== "assignments" && bucket !== "submissions") {
      return NextResponse.json(
        { success: false, error: "Invalid bucket name." },
        { status: 400 },
      );
    }

    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "You must be logged in." },
        { status: 401 },
      );
    }

    const supabase = createAdminClient();

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return NextResponse.json(
        { success: false, error: "Failed to access storage." },
        { status: 500 },
      );
    }

    const bucketExists = buckets?.some((b) => b.name === bucket);

    if (!bucketExists) {
      console.error(`Bucket "${bucket}" does not exist. Available buckets:`, buckets?.map((b) => b.name));
      return NextResponse.json(
        {
          success: false,
          error: `Bucket "${bucket}" not found. Please create it in Supabase Storage.`,
        },
        { status: 404 },
      );
    }

    // For assignments: anyone authenticated can view
    if (bucket === "assignments") {
      // Get signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        return NextResponse.json(
          {
            success: false,
            error: signedUrlError.message || "Failed to generate file URL.",
          },
          { status: 500 },
        );
      }

      // Redirect to the signed URL
      if (signedUrlData?.signedUrl) {
        return NextResponse.redirect(signedUrlData.signedUrl);
      }
    }

    // For submissions: students can only view their own, teachers can view all
    if (bucket === "submissions") {
      // Extract student ID from path: {assignmentId}/{studentId}/{filename}
      const pathParts = filePath.split("/");
      const studentIdFromPath = pathParts.length >= 2 ? pathParts[1] : null;

      // Permission check: students can only view their own files, teachers can view all
      if (session.role === "student") {
        if (!studentIdFromPath || studentIdFromPath !== session.userId) {
          return NextResponse.json(
            { success: false, error: "You do not have permission to view this file." },
            { status: 403 },
          );
        }
      } else if (session.role !== "teacher") {
        // Only students and teachers can view submissions
        return NextResponse.json(
          { success: false, error: "You do not have permission to view submission files." },
          { status: 403 },
        );
      }

      // Get signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        console.error("File path:", filePath);
        console.error("Bucket:", bucket);
        return NextResponse.json(
          {
            success: false,
            error: signedUrlError.message || "Failed to generate file URL.",
          },
          { status: 500 },
        );
      }

      // Redirect to the signed URL
      if (signedUrlData?.signedUrl) {
        return NextResponse.redirect(signedUrlData.signedUrl);
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate file URL." },
      { status: 500 },
    );
  } catch (error) {
    console.error("Unexpected error serving file:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

