import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherAnnouncements } from "@/app/actions/announcements";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AnnouncementsPageClient } from "./announcements-page-client";
import { EmptyState } from "@/components/empty-state";
import { getTeacherCourses } from "@/app/actions/courses";

export default async function TeacherAnnouncementsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (currentUser.role !== "teacher") {
    redirect("/teacher/dashboard");
  }

  const [announcementsResult, coursesResult] = await Promise.all([
    getTeacherAnnouncements(),
    getTeacherCourses(),
  ]);

  const announcements = announcementsResult.success
    ? announcementsResult.announcements
    : [];
  const courses = coursesResult.success ? coursesResult.courses : [];

  return (
    <DashboardShell role="teacher">
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Announcements
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Manage Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage announcements for students and parents
          </p>
        </div>
      </section>

      <AnnouncementsPageClient
        initialAnnouncements={announcements}
        courses={courses}
        error={announcementsResult.success ? null : announcementsResult.error}
      />
    </DashboardShell>
  );
}

