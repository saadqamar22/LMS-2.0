export const metadata = {
  title: "Admin Dashboard | AI LMS",
  description: "Admin dashboard for AI LMS",
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Manage the overall AI LMS platform. Add analytics and admin tools here.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            This is a placeholder admin dashboard. Add platform-level metrics, user management tools, and system configuration panels here.
          </p>
        </div>
      </div>
    </div>
  );
}
