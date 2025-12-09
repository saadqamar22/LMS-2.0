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
    primary: "#3B82F6", // Blue
    primaryHover: "#2563EB",
    primaryLight: "#DBEAFE",
    primaryDark: "#1E40AF",
    primaryBg: "bg-blue-50",
    primaryBorder: "border-blue-200",
    primaryText: "text-blue-600",
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-600",
    shadow: "shadow-blue-200",
  },
  teacher: {
    primary: "#8B5CF6", // Purple
    primaryHover: "#7C3AED",
    primaryLight: "#EDE9FE",
    primaryDark: "#6D28D9",
    primaryBg: "bg-purple-50",
    primaryBorder: "border-purple-200",
    primaryText: "text-purple-600",
    gradientFrom: "from-purple-500",
    gradientTo: "to-purple-600",
    shadow: "shadow-purple-200",
  },
  parent: {
    primary: "#10B981", // Green
    primaryHover: "#059669",
    primaryLight: "#D1FAE5",
    primaryDark: "#047857",
    primaryBg: "bg-green-50",
    primaryBorder: "border-green-200",
    primaryText: "text-green-600",
    gradientFrom: "from-green-500",
    gradientTo: "to-green-600",
    shadow: "shadow-green-200",
  },
  admin: {
    primary: "#4F46E5", // Indigo (default)
    primaryHover: "#4338CA",
    primaryLight: "#C7D2FE",
    primaryDark: "#3730A3",
    primaryBg: "bg-indigo-50",
    primaryBorder: "border-indigo-200",
    primaryText: "text-indigo-600",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-indigo-600",
    shadow: "shadow-indigo-200",
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

