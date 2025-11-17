import { redirect } from "next/navigation";

export const metadata = {
  title: "Teacher Dashboard | AI LMS",
  description: "Teacher dashboard for AI LMS",
};

export default function LegacyTeacherDashboard() {
  redirect("/teacher/dashboard");
}

