"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3,
  BookOpen,
  Bot,
  ChartLine,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import type { Role } from "@/lib/auth/session";
import { getRoleColorScheme } from "@/lib/utils/role-colors";

const ROLE_NAV: Record<
  Role | "ai",
  { label: string; href: string; icon: React.ElementType }[]
> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Courses", href: "/student/courses", icon: BookOpen },
    { label: "Assignments", href: "/student/assignments", icon: ClipboardList },
    { label: "Announcements", href: "/student/announcements", icon: Megaphone },
    { label: "Attendance", href: "/student/attendance", icon: ChartLine },
    { label: "Marks", href: "/student/marks", icon: BarChart3 },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Courses", href: "/teacher/courses", icon: BookOpen },
    { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    { label: "Announcements", href: "/teacher/announcements", icon: Megaphone },
    { label: "Students", href: "/teacher/students", icon: Users },
    { label: "Attendance", href: "/teacher/attendance", icon: ChartLine },
    { label: "Marks", href: "/teacher/marks", icon: FileText },
    { label: "Quizzes", href: "/teacher/quizzes", icon: ClipboardList },
  ],
  parent: [
    { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
    { label: "Children", href: "/parent/children", icon: Users },
    { label: "Announcements", href: "/parent/announcements", icon: Megaphone },
    { label: "Reports", href: "/parent/reports", icon: FileText },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  ai: [
    { label: "Chat Assistant (Coming Soon)", href: "/ai/chat-assistant", icon: Bot },
    { label: "Quiz Generator (Coming Soon)", href: "/ai/quiz-generator", icon: ClipboardList },
    { label: "Summarizer (Coming Soon)", href: "/ai/summarizer", icon: FileText },
    { label: "Parent Reports (Coming Soon)", href: "/ai/parent-report", icon: GraduationCap },
  ],
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const colors = getRoleColorScheme(role);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white/90 px-6 py-8 shadow-sm lg:flex">
      <Link href="/" className="mb-10 flex items-center gap-3">
        <div 
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
          style={{
            background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryHover})`,
          }}
        >
          <Home className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">
            ILMS
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Smart Learning
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-8 overflow-y-auto pb-10">
        <nav className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {role} space
          </p>
          {ROLE_NAV[role].map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? `text-[${colors.primary}]`
                    : "text-slate-500 hover:bg-slate-50",
                )}
                style={isActive ? {
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                } : {}}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4",
                    isActive ? "" : "text-slate-400",
                  )}
                  style={isActive ? { color: colors.primary } : {}}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">AI</p>
          {ROLE_NAV.ai.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? `text-[${colors.primary}]`
                    : "text-slate-500 hover:bg-slate-50",
                )}
                style={isActive ? {
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                } : {}}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4",
                    isActive ? "" : "text-slate-400",
                  )}
                  style={isActive ? { color: colors.primary } : {}}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

