import { DashboardShell } from "@/components/dashboard-shell";
import { FormInput } from "@/components/form-input";
import { SelectRoleDropdown } from "@/components/select-role-dropdown";

export default function AdminSettingsPage() {
  return (
    <DashboardShell role="admin">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Settings
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Platform preferences
        </h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <FormInput label="Institution name" placeholder="Enter organization name" />
          <FormInput label="Support email" placeholder="e.g., support@example.com" />
          <SelectRoleDropdown label="Default role" />
          <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
            <option value="">Region</option>
            <option value="global">Global</option>
            <option value="north-america">North America</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Cancel
          </button>
          <button className="rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
            Save changes
          </button>
        </div>
      </section>
    </DashboardShell>
  );
}

