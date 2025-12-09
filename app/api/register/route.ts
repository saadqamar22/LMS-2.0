"use server";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth/session";

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
  parent_id?: string; // For parent registration - must exist in students table
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
    parent_id, // For parent registration
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
    if (!parent_id?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Parent ID is required. You must have a valid parent ID from your child's student record.",
        },
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

    // Validate that the parent_id exists in students table (created by trigger)
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("id, parent_id")
      .eq("parent_id", parent_id);

    if (studentError) {
      console.error("Error validating parent ID:", studentError);
      return NextResponse.json(
        {
          success: false,
          error: "Error validating parent ID. Please try again.",
        },
        { status: 500 },
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parent ID. Please check your parent ID and try again.",
        },
        { status: 400 },
      );
    }

    // Check if a parent account already exists for any of these students
    const studentIds = students.map((s) => s.id);
    const { data: existingParent, error: existingParentError } = await supabase
      .from("students")
      .select("parent_id")
      .in("id", studentIds)
      .not("parent_id", "eq", parent_id)
      .limit(1);

    if (existingParentError && existingParentError.code !== "PGRST116") {
      console.error("Error checking existing parent:", existingParentError);
      return NextResponse.json(
        {
          success: false,
          error: "Error validating parent ID. Please try again.",
        },
        { status: 500 },
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const {
      data: userData,
      error: userError,
    } = await supabase
      .from("users")
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
      // Registration number and parent_id are auto-assigned by database triggers
      // Explicitly set parent_id to NULL to ensure trigger can handle it properly
      const { error: studentError } = await supabase.from("students").insert([
        {
          id: userId,
          class: studentClass,
          section,
          registration_number: null, // Explicitly null - trigger will assign
          parent_id: null, // Explicitly null - trigger will assign UUID
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
      const { error: teacherError } = await supabase.from("teachers").insert([
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
      const { error: parentError } = await supabase.from("parents").insert([
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

      // Update all students with this parent_id to point to the new parent user ID
      const { error: updateError } = await supabase
        .from("students")
        .update({ parent_id: userId })
        .eq("parent_id", parent_id);

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

