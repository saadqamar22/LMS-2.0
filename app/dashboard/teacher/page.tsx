import { redirect } from "next/navigation";

export const metadata = {
  title: "Teacher Dashboard | ILMS",
  description: "Teacher dashboard for ILMS",
};

export default function LegacyTeacherDashboard() {
  redirect("/teacher/dashboard");
}

