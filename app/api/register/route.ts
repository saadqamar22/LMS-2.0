import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth/session";

/** Generates a human-readable 8-char parent key, e.g. "A3K9-X7MP" */
function generateParentKey(): string {
  // Avoid visually confusing chars: 0, O, 1, I, L
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) key += "-";
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

interface RegisterPayload {
  full_name?: string;
  email?: string;
  password?: string;
  role?: Role;
  class?: string;
  section?: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  phone_number?: string;
  address?: string;
  parent_id?: string; // Deprecated: use parent_ids instead
  parent_ids?: string[]; // For parent registration - array of parent IDs that must exist in students table
}

function validateEmail(email: string) {
  return email.includes("@") && email.length > 3;
}

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("Supabase configuration error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Supabase configuration is invalid. Please check environment variables.",
      },
      { status: 500 },
    );
  }

  let body: RegisterPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const {
    full_name,
    email,
    password,
    role,
    class: studentClass,
    section,
    employee_id,
    department,
    designation,
    phone_number,
    address,
    parent_id, // Deprecated: kept for backward compatibility
    parent_ids, // For parent registration - array of parent IDs
  } = body;

  if (!full_name?.trim()) {
    return NextResponse.json(
      { success: false, error: "Full name is required." },
      { status: 400 },
    );
  }

  if (!email || !validateEmail(email)) {
    return NextResponse.json(
      { success: false, error: "A valid email address is required." },
      { status: 400 },
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { success: false, error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  if (!role || !["student", "teacher", "parent", "admin"].includes(role)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid role. Must be student, teacher, parent, or admin.",
      },
      { status: 400 },
    );
  }

  if (role === "student") {
    // Registration number is auto-assigned by database trigger
    if (!studentClass?.trim()) {
      return NextResponse.json(
        { success: false, error: "Class is required for students." },
        { status: 400 },
      );
    }
    if (!section?.trim()) {
      return NextResponse.json(
        { success: false, error: "Section is required for students." },
        { status: 400 },
      );
    }
  }

  if (role === "teacher") {
    if (!employee_id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required for teachers." },
        { status: 400 },
      );
    }

    if (!department?.trim()) {
      return NextResponse.json(
        { success: false, error: "Department is required for teachers." },
        { status: 400 },
      );
    }
    if (!designation?.trim()) {
      return NextResponse.json(
        { success: false, error: "Designation is required for teachers." },
        { status: 400 },
      );
    }
  }

  if (role === "parent") {
    const parentKeyList = (parent_ids && parent_ids.length > 0
      ? parent_ids
      : parent_id ? [parent_id] : []
    ).map(k => k.trim().toUpperCase()).filter(Boolean);

    if (parentKeyList.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one Child Parent Key is required." },
        { status: 400 },
      );
    }

    if (!phone_number?.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required for parents." },
        { status: 400 },
      );
    }

    if (!address?.trim()) {
      return NextResponse.json(
        { success: false, error: "Address is required for parents." },
        { status: 400 },
      );
    }

    // Validate all keys exist in students table
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("id, parent_id, parent_key")
      .in("parent_key", parentKeyList);

    if (studentError) {
      console.error("Error validating parent keys:", studentError);
      return NextResponse.json(
        { success: false, error: "Error validating Parent Keys. Please try again." },
        { status: 500 },
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No student found with that Parent Key. Make sure your child has logged into their dashboard at least once so their key is activated, then try again.",
        },
        { status: 400 },
      );
    }

    const studentsList = students as Array<{ id: string; parent_id: string | null; parent_key: string | null }>;

    // Check all provided keys were found
    const foundKeys = new Set(studentsList.map(s => s.parent_key));
    const missing = parentKeyList.filter(k => !foundKeys.has(k));
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid Parent Key(s): ${missing.join(", ")}. Please check and try again.` },
        { status: 400 },
      );
    }

    // Check none of the students already have a parent linked
    const alreadyLinked = studentsList.filter(s => s.parent_id !== null);
    if (alreadyLinked.length > 0) {
      return NextResponse.json(
        { success: false, error: "One or more of these students already have a parent account linked. Contact the administrator if this is an error." },
        { status: 400 },
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const insertQuery = supabase.from("users") as any;
    const {
      data: userData,
      error: userError,
    } = await insertQuery
      .insert([
        {
          full_name,
          email,
          password: hashedPassword,
          role,
        },
      ])
      .select("id")
      .single();

    if (userError) {
      if (userError.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Email already exists." },
          { status: 409 },
        );
      }

      console.error("User insert error:", userError);
      return NextResponse.json(
        {
          success: false,
          error: userError.message ?? "Failed to create user.",
        },
        { status: 500 },
      );
    }

    const userId = userData?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID was not returned from Supabase." },
        { status: 500 },
      );
    }

    if (role === "student") {
      // Generate a unique parent_key for this student
      let parentKey = generateParentKey();
      // Ensure uniqueness (retry on collision — extremely rare)
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("parent_key", parentKey)
          .maybeSingle();
        if (!existing) break;
        parentKey = generateParentKey();
      }

      const studentInsertQuery = supabase.from("students") as any;
      const { error: studentError } = await studentInsertQuery.insert([
        {
          id: userId,
          class: studentClass,
          section,
          registration_number: null,
          parent_id: null,
          parent_key: parentKey,
        },
      ]);

      if (studentError) {
        console.error("Student insert error:", JSON.stringify(studentError, null, 2));
        await supabase.from("users").delete().eq("id", userId);
        
        // Provide more helpful error message for UUID issues
        let errorMessage = studentError.message ?? "Failed to create student record.";
        if (errorMessage.includes("uuid") || errorMessage.includes("Invalid input syntax")) {
          errorMessage = "Database error: The registration system encountered an issue. Please contact support. The trigger may need to be updated to generate proper UUID values.";
        }
        
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: 500 },
        );
      }
    }

    if (role === "teacher") {
      const teacherInsertQuery = supabase.from("teachers") as any;
      const { error: teacherError } = await teacherInsertQuery.insert([
        {
          id: userId,
          employee_id,
          department,
          designation,
        },
      ]);

      if (teacherError) {
        console.error("Teacher insert error:", teacherError);
        await supabase.from("users").delete().eq("id", userId);
        return NextResponse.json(
          {
            success: false,
            error: teacherError.message ?? "Failed to create teacher record.",
          },
          { status: 500 },
        );
      }
    }

    if (role === "parent") {
      // First create the parent record
      const parentInsertQuery = supabase.from("parents") as any;
      const { error: parentError } = await parentInsertQuery.insert([
        {
          id: userId,
          full_name,
          phone_number,
          address,
        },
      ]);

      if (parentError) {
        console.error("Parent insert error:", parentError);
        await supabase.from("users").delete().eq("id", userId);
        return NextResponse.json(
          {
            success: false,
            error: parentError.message ?? "Failed to create parent record.",
          },
          { status: 500 },
        );
      }

      // Link the new parent user to all matched students via parent_key
      const parentKeyList = (parent_ids && parent_ids.length > 0
        ? parent_ids
        : parent_id ? [parent_id] : []
      ).map(k => k.trim().toUpperCase()).filter(Boolean);

      const updateQuery = supabase.from("students") as any;
      const { error: updateError } = await updateQuery
        .update({ parent_id: userId })
        .in("parent_key", parentKeyList);

      if (updateError) {
        console.error("Error updating student parent_id:", updateError);
        // Rollback: delete parent and user records
        await supabase.from("parents").delete().eq("id", userId);
        await supabase.from("users").delete().eq("id", userId);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to link parent account to student records.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        data: { user_id: userId, role },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred during registration.",
      },
      { status: 500 },
    );
  }
}

