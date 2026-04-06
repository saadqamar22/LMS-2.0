import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | ILMS",
  description: "Admin dashboard for ILMS",
};

export default function LegacyAdminDashboard() {
  redirect("/admin/dashboard");
}
