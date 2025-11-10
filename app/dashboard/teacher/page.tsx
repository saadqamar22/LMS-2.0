import LogoutButton from "@/components/logout-button";

export const metadata = {
  title: "Teacher Dashboard | AI LMS",
  description: "Teacher dashboard for AI LMS",
};

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
              Teacher Dashboard
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage your courses, students, and assignments.
            </p>
          </div>
          <div className="flex-shrink-0">
            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* My Courses Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              My Courses
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Created courses
            </p>
          </div>

          {/* Students Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Students
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Total students
            </p>
          </div>

          {/* Assignments Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Assignments
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Pending reviews
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Quick Actions
          </h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              Create New Course
            </button>
            <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800">
              View All Students
            </button>
            <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800">
              Create Assignment
            </button>
          </div>
        </div>

        {/* Recent Students */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Recent Students
          </h2>
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p>No students enrolled yet.</p>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Course Statistics
          </h2>
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p>No course statistics available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

