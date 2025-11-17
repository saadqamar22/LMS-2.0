import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | AI LMS",
  description: "Admin dashboard for AI LMS",
};

export default function LegacyAdminDashboard() {
  redirect("/admin/dashboard");
}
