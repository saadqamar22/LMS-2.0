"use client";

import { useState } from "react";
import { GraduationCap, Percent } from "lucide-react";
import { formatGPA, formatPercentage } from "@/lib/utils/gpa-calculator";

interface GPADisplayProps {
  gpa: number;
  percentage: number;
  size?: "sm" | "md" | "lg";
  showToggle?: boolean;
}

export function GPADisplay({
  gpa,
  percentage,
  size = "md",
  showToggle = true,
}: GPADisplayProps) {
  const [showGPA, setShowGPA] = useState(true);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-2">
      {showToggle ? (
        <button
          type="button"
          onClick={() => setShowGPA(!showGPA)}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 transition hover:bg-slate-200"
          title={`Click to switch to ${showGPA ? "percentage" : "GPA"}`}
        >
          {showGPA ? (
            <GraduationCap className={`${iconSizes[size]}`} style={{ color: "var(--role-primary)" }} />
          ) : (
            <Percent className={`${iconSizes[size]}`} style={{ color: "var(--role-primary)" }} />
          )}
          <span className={`font-semibold tabular-nums ${sizeClasses[size]}`} style={{ color: "var(--role-primary)" }}>
            {showGPA ? formatGPA(gpa) : formatPercentage(percentage)}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
          <GraduationCap className={iconSizes[size]} style={{ color: "var(--role-primary)" }} />
          <span className={`font-semibold tabular-nums ${sizeClasses[size]}`} style={{ color: "var(--role-primary)" }}>
            {formatGPA(gpa)}
          </span>
          <span className="text-sm text-slate-500">({formatPercentage(percentage)})</span>
        </div>
      )}
    </div>
  );
}
