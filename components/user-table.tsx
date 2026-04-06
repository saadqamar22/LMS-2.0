import { Role } from "@/lib/auth/session";

interface UserTableProps {
  users: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    status?: "active" | "invited" | "inactive";
  }[];
}

const STATUS_STYLE: Record<
  NonNullable<UserTableProps["users"][number]["status"]>,
  string
> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-blue-100 text-blue-700",
  inactive: "bg-slate-100 text-slate-500",
};

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)]">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 font-medium text-slate-900">
                {user.fullName}
              </td>
              <td className="px-6 py-4 text-slate-500">{user.email}</td>
              <td className="px-6 py-4 capitalize text-slate-600">
                {user.role}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[user.status ?? "active"]}`}
                >
                  {user.status ?? "active"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

