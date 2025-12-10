import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export default async function AIQuizGeneratorPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell role={currentUser.role as "student" | "teacher" | "parent" | "admin"}>
      <EmptyState
        title="Coming Soon"
        description="The AI Quiz Generator feature is currently under development. Check back soon for updates!"
      />
    </DashboardShell>
  );
}
