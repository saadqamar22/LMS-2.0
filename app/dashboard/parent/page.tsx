import LogoutButton from "@/components/logout-button";

export const metadata = {
  title: "Parent Dashboard | AI LMS",
  description: "Parent dashboard for AI LMS",
};

export default function ParentDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
              Parent Dashboard
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Monitor your child&apos;s progress and academic performance.
            </p>
          </div>
          <div className="flex-shrink-0">
            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Children Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Children
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Linked accounts
            </p>
          </div>

          {/* Progress Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Overall Progress
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0%
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Average completion
            </p>
          </div>

          {/* Notifications Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Notifications
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              0
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Unread notifications
            </p>
          </div>
        </div>

        {/* Children List */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            My Children
          </h2>
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p>No children linked to your account yet.</p>
            <button className="mt-4 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              Link Child Account
            </button>
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

        {/* Performance Overview */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Performance Overview
          </h2>
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p>No performance data available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

