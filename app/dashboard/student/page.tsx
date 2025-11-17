import { redirect } from "next/navigation";

export const metadata = {
  title: "Student Dashboard | AI LMS",
  description: "Student dashboard for AI LMS",
};

export default function LegacyStudentDashboard() {
  redirect("/student/dashboard");
}

