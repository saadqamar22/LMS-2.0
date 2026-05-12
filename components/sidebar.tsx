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
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  PenTool,
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
    { label: "Quizzes", href: "/student/quizzes", icon: ClipboardList },
    { label: "Assignments", href: "/student/assignments", icon: PenTool },
    { label: "Announcements", href: "/student/announcements", icon: Megaphone },
    { label: "Attendance", href: "/student/attendance", icon: ChartLine },
    { label: "Marks", href: "/student/marks", icon: BarChart3 },
    { label: "Messages", href: "/student/messages", icon: MessageSquare },
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
    { label: "Messages", href: "/teacher/messages", icon: MessageSquare },
  ],
  parent: [
    { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
    { label: "Children", href: "/parent/children", icon: Users },
    { label: "Announcements", href: "/parent/announcements", icon: Megaphone },
    { label: "Messages", href: "/parent/messages", icon: MessageSquare },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  ai: [
    { label: "Chat Assistant", href: "/ai/chat-assistant", icon: Bot },
    { label: "Quiz Generator", href: "/ai/quiz-generator", icon: ClipboardList },
    { label: "Summarizer", href: "/ai/summarizer", icon: FileText },
    { label: "AI Progress Report", href: "/ai/parent-report", icon: GraduationCap },
  ],
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const colors = getRoleColorScheme(role);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: colors.primary }}
        >
          IL
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900">ILMS</span>
      </Link>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6">
        {/* Role nav */}
        <nav>
          <p className="mb-1.5 px-2 text-[11px] font-medium text-slate-400">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
          <div className="space-y-0.5">
            {ROLE_NAV[role].map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                    isActive
                      ? "font-medium"
                      : "font-normal text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  )}
                  style={isActive ? {
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                  } : {}}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={isActive ? { color: colors.primary } : { color: "#94A3B8" }}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* AI nav */}
        <nav>
          <p className="mb-1.5 px-2 text-[11px] font-medium text-slate-400">AI Tools</p>
          <div className="space-y-0.5">
            {ROLE_NAV.ai.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                    isActive
                      ? "font-medium"
                      : "font-normal text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  )}
                  style={isActive ? {
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                  } : {}}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={isActive ? { color: colors.primary } : { color: "#94A3B8" }}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
