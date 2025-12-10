"use server";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  type Role,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

interface LoginPayload {
  email?: string;
  password?: string;
}

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
  admin: "/admin/dashboard",
};

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

  let body: LoginPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const { email, password } = body;

  if (!email || !validateEmail(email)) {
    return NextResponse.json(
      { success: false, error: "A valid email address is required." },
      { status: 400 },
    );
  }

  if (!password) {
    return NextResponse.json(
      { success: false, error: "Password is required." },
      { status: 400 },
    );
  }

  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, full_name, email, password, role")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const userData = user as {
      id: string;
      full_name: string | null;
      email: string;
      password: string;
      role: string;
    };
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const role = (userData.role ?? "student") as Role;
    const redirectPath = ROLE_DASHBOARD_MAP[role] ?? "/";

    const token = await createSessionToken({
      userId: userData.id,
      role,
      email: userData.email,
      fullName: userData.full_name ?? "",
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      redirectTo: redirectPath,
      data: {
        userId: userData.id,
        role,
        fullName: userData.full_name,
        email: userData.email,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Unexpected login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred during login.",
      },
      { status: 500 },
    );
  }
}

