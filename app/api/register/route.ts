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
  registration_number?: string;
  class?: string;
  parent_id?: string | null;
  section?: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  phone_number?: string;
  address?: string;
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
    registration_number,
    class: studentClass,
    parent_id,
    section,
    employee_id,
    department,
    designation,
    phone_number,
    address,
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
    if (!registration_number?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration number is required for students.",
        },
        { status: 400 },
      );
    }

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
      const { error: studentError } = await supabase.from("students").insert([
        {
          id: userId,
          registration_number,
          class: studentClass,
          section,
          parent_id: parent_id || null,
        },
      ]);

      if (studentError) {
        console.error("Student insert error:", studentError);
        await supabase.from("users").delete().eq("id", userId);
        return NextResponse.json(
          {
            success: false,
            error: studentError.message ?? "Failed to create student record.",
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

