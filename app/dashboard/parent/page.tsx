import { redirect } from "next/navigation";

export const metadata = {
  title: "Parent Dashboard | AI LMS",
  description: "Parent dashboard for AI LMS",
};

export default function LegacyParentDashboard() {
  redirect("/parent/dashboard");
}

