import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  type Role,
} from "@/lib/auth/session";

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  student: "/dashboard/student",
  teacher: "/dashboard/teacher",
  parent: "/dashboard/parent",
  admin: "/dashboard/admin",
};

export default async function Home() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const session = await verifySessionToken(token);

  if (!session) {
    redirect("/auth/login");
  }

  const redirectPath = ROLE_DASHBOARD_MAP[session.role] ?? "/auth/login";
  redirect(redirectPath);
}
