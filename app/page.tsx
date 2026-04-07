import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";

const ROLE_DASHBOARD: Record<string, string> = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
  admin: "/admin/dashboard",
};

export default async function Home() {
  const session = await getCurrentSession();
  if (session) {
    redirect(ROLE_DASHBOARD[session.role] ?? "/auth/login");
  }
  redirect("/auth/login");
}
