import { SelectHTMLAttributes } from "react";
import clsx from "clsx";
import type { Role } from "@/lib/auth/session";

interface SelectRoleDropdownProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  roles?: Role[];
}

const DEFAULT_ROLES: Role[] = ["student", "teacher", "parent", "admin"];

export function SelectRoleDropdown({
  label = "Role",
  roles = DEFAULT_ROLES,
  className,
  ...props
}: SelectRoleDropdownProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        {...props}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#A5B4FC]",
          className,
        )}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

