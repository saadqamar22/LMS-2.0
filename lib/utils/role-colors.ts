import type { Role } from "@/lib/auth/session";

export interface RoleColorScheme {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  primaryBorder: string;
  primaryText: string;
  gradientFrom: string;
  gradientTo: string;
  shadow: string;
}

const colorSchemes: Record<Role, RoleColorScheme> = {
  student: {
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    primaryLight: "#EFF6FF",
    primaryDark: "#1E40AF",
    primaryBg: "bg-blue-50",
    primaryBorder: "border-blue-200",
    primaryText: "text-blue-600",
    gradientFrom: "from-blue-600",
    gradientTo: "to-blue-700",
    shadow: "shadow-blue-100",
  },
  teacher: {
    primary: "#7C3AED",
    primaryHover: "#6D28D9",
    primaryLight: "#F5F3FF",
    primaryDark: "#5B21B6",
    primaryBg: "bg-violet-50",
    primaryBorder: "border-violet-200",
    primaryText: "text-violet-600",
    gradientFrom: "from-violet-600",
    gradientTo: "to-violet-700",
    shadow: "shadow-violet-100",
  },
  parent: {
    primary: "#059669",
    primaryHover: "#047857",
    primaryLight: "#ECFDF5",
    primaryDark: "#065F46",
    primaryBg: "bg-emerald-50",
    primaryBorder: "border-emerald-200",
    primaryText: "text-emerald-600",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-emerald-700",
    shadow: "shadow-emerald-100",
  },
  admin: {
    primary: "#4F46E5",
    primaryHover: "#4338CA",
    primaryLight: "#EEF2FF",
    primaryDark: "#3730A3",
    primaryBg: "bg-indigo-50",
    primaryBorder: "border-indigo-200",
    primaryText: "text-indigo-600",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-indigo-700",
    shadow: "shadow-indigo-100",
  },
};

export function getRoleColorScheme(role: Role): RoleColorScheme {
  return colorSchemes[role];
}

export function getRolePrimaryColor(role: Role): string {
  return colorSchemes[role].primary;
}

export function getRolePrimaryHover(role: Role): string {
  return colorSchemes[role].primaryHover;
}
