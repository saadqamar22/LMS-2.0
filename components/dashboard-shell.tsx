import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import type { Role } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserProfile } from "@/app/actions/profile";
import { getRoleColorScheme } from "@/lib/utils/role-colors";

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

export async function DashboardShell({ role, children }: DashboardShellProps) {
  const currentUser = await getCurrentUser();
  const fullName = currentUser?.fullName ?? "Guest";
  
  // Fetch user profile with role-specific information
  const profileResult = await getUserProfile();
  const profile = profileResult.success ? profileResult.profile : null;
  
  // Get role-based color scheme
  const colors = getRoleColorScheme(role);

  return (
    <div 
      className="min-h-screen bg-[#F9FAFB] text-slate-900"
      style={{
        '--role-primary': colors.primary,
        '--role-primary-hover': colors.primaryHover,
        '--role-primary-light': colors.primaryLight,
        '--role-primary-dark': colors.primaryDark,
        '--role-shadow': colors.shadow,
      } as React.CSSProperties & {
        '--role-primary': string;
        '--role-primary-hover': string;
        '--role-primary-light': string;
        '--role-primary-dark': string;
        '--role-shadow': string;
      }}
    >
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1">
          <Navbar role={role} fullName={fullName} profile={profile} />
          <main className="space-y-8 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

