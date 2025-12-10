import { DashboardShell } from "@/components/dashboard-shell";
import { getStudentAnnouncements } from "@/app/actions/announcements";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AnnouncementCard } from "@/components/announcement-card";
import { EmptyState } from "@/components/empty-state";

export default async function StudentAnnouncementsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (currentUser.role !== "student") {
    redirect("/student/dashboard");
  }

  const announcementsResult = await getStudentAnnouncements();

  if (!announcementsResult.success) {
    return (
      <DashboardShell role="student">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {announcementsResult.error}
        </div>
      </DashboardShell>
    );
  }

  const announcements = announcementsResult.announcements;

  return (
    <DashboardShell role="student">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Announcements
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Announcements
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Stay updated with important announcements from your teachers
        </p>
      </section>

      {announcements.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="You don't have any announcements yet. Check back later for updates."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.announcement_id}
              announcement={announcement}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

