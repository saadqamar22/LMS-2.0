import { redirect } from "next/navigation";

export const metadata = {
  title: "Parent Dashboard | ILMS",
  description: "Parent dashboard for ILMS",
};

export default function LegacyParentDashboard() {
  redirect("/parent/dashboard");
}

