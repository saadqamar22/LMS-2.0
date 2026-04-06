import { redirect } from "next/navigation";

export const metadata = {
  title: "Student Dashboard | ILMS",
  description: "Student dashboard for ILMS",
};

export default function LegacyStudentDashboard() {
  redirect("/student/dashboard");
}

