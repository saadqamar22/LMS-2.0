import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import type { Role } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/get-current-user";

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

export async function DashboardShell({ role, children }: DashboardShellProps) {
  const currentUser = await getCurrentUser();
  const fullName = currentUser?.fullName ?? "Guest";

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1">
          <Navbar role={role} fullName={fullName} />
          <main className="space-y-8 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

