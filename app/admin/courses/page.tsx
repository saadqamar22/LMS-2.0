import { DashboardShell } from "@/components/dashboard-shell";
import { CreateCourseModal } from "@/components/modals/create-course-modal";
import { EmptyState } from "@/components/empty-state";

export default function AdminCoursesPage() {
  return (
    <DashboardShell role="admin">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Catalog
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Manage courses
          </h1>
        </div>
        <CreateCourseModal />
      </section>
      <EmptyState
        title="No courses loaded"
        description="Fetch all courses from Supabase and render them here for admins."
      />
    </DashboardShell>
  );
}

