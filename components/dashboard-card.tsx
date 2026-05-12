import { ReactNode } from "react";
import clsx from "clsx";

interface DashboardCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    label: string;
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">
            {value}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50"
            style={{ color: "var(--role-primary)" }}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <p
          className={clsx(
            "mt-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
            trend.positive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600",
          )}
        >
          {trend.value}
          <span className="font-normal text-slate-500">{trend.label}</span>
        </p>
      )}
    </div>
  );
}
