import { ReactNode } from "react";
import clsx from "clsx";

interface StatsCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "neutral";
}

export function StatsCard({
  label,
  value,
  helper,
  icon,
  variant = "neutral",
}: StatsCardProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  return (
    <div
      className={clsx(
        "rounded-xl border p-5",
        isPrimary && "border-transparent text-white",
        isSecondary && "border-slate-200 bg-slate-50 text-slate-900",
        !isPrimary && !isSecondary && "border-slate-200 bg-white text-slate-900",
      )}
      style={isPrimary ? { backgroundColor: "var(--role-primary)", borderColor: "var(--role-primary)" } : {}}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={clsx("text-xs font-medium", isPrimary ? "text-white/70" : "text-slate-500")}>
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
          {helper && (
            <p className={clsx("mt-0.5 text-xs", isPrimary ? "text-white/60" : "text-slate-400")}>
              {helper}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              isPrimary ? "bg-white/15" : "bg-slate-100",
            )}
            style={!isPrimary ? { color: "var(--role-primary)" } : { color: "white" }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
