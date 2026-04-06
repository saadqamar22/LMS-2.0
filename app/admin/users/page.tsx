import { DashboardShell } from "@/components/dashboard-shell";
import { SelectRoleDropdown } from "@/components/select-role-dropdown";
import { FormInput } from "@/components/form-input";
import { EmptyState } from "@/components/empty-state";

export default function AdminUsersPage() {
  return (
    <DashboardShell role="admin">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Directory
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Manage users
            </h1>
          </div>
          <button className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
            Add user
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormInput label="Search" placeholder="Name or email" />
          <SelectRoleDropdown label="Role" />
          <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
            <option>Status</option>
            <option>Active</option>
            <option>Invited</option>
          </select>
          <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Filter
          </button>
        </div>
      </section>
      <EmptyState
        title="No users loaded"
        description="Load users from Supabase and pass them into your management table."
      />
    </DashboardShell>
  );
}

