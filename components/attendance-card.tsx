import { ReactNode } from "react";
import clsx from "clsx";

interface AttendanceCardProps {
  label: string;
  value: string;
  status?: "present" | "absent" | "late";
  icon?: ReactNode;
}

const STATUS_COLOR: Record<
  NonNullable<AttendanceCardProps["status"]>,
  string
> = {
  present: "text-green-600 bg-green-50",
  absent: "text-red-600 bg-red-50",
  late: "text-amber-600 bg-amber-50",
};

export function AttendanceCard({
  label,
  value,
  status = "present",
  icon,
}: AttendanceCardProps) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div
        className={clsx(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize",
          STATUS_COLOR[status],
        )}
      >
        {icon}
        {status}
      </div>
    </div>
  );
}

