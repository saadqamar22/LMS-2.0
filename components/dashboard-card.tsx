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
        "rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {typeof value === "string" || typeof value === "number" ? value : value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <p
          className={clsx(
            "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
            trend.positive
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600",
          )}
        >
          {trend.value}
          <span className="text-slate-500">{trend.label}</span>
        </p>
      )}
    </div>
  );
}

