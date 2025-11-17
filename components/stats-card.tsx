import { ReactNode } from "react";
import clsx from "clsx";

interface StatsCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "neutral";
}

const VARIANT_STYLES: Record<
  NonNullable<StatsCardProps["variant"]>,
  string
> = {
  primary:
    "bg-gradient-to-br from-[#4F46E5] to-[#6366F1] text-white shadow-indigo-200",
  secondary: "bg-[#EEF2FF] text-[#312E81]",
  neutral: "bg-white text-slate-900",
};

export function StatsCard({
  label,
  value,
  helper,
  icon,
  variant = "neutral",
}: StatsCardProps) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/60 p-6 shadow-[var(--shadow-card)]",
        VARIANT_STYLES[variant],
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          {helper && <p className="mt-1 text-xs opacity-70">{helper}</p>}
        </div>
        {icon && (
          <div className="rounded-2xl bg-white/20 p-3 text-white">{icon}</div>
        )}
      </div>
    </div>
  );
}

