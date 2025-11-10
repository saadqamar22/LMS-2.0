import LogoutButton from "@/components/logout-button";

export const metadata = {
  title: "Student Dashboard | AI LMS",
  description: "Student dashboard for AI LMS",
};

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
              Student Dashboard
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Welcome back! Here&apos;s an overview of your courses and progress.
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
              Enrolled courses
            </p>
          </div>

          {/* Progress Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Progress
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0%
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Overall completion
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
              Pending assignments
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Recent Activity
          </h2>
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p>No recent activity to display.</p>
          </div>
        </div>

        {/* Upcoming Courses */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Upcoming Courses
          </h2>
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p>No upcoming courses available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

