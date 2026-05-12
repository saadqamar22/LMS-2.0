"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./logout-button";
import { UserInfoDropdown } from "./user-info-dropdown";
import { NotificationBell } from "./notification-bell";
import type { UserProfile } from "@/app/actions/profile";
import type { Role } from "@/lib/auth/session";
import { getRoleColorScheme } from "@/lib/utils/role-colors";

interface NavbarProps {
  onMenuClick?: () => void;
  avatarUrl?: string;
  fullName?: string;
  role?: Role;
  profile?: UserProfile | null;
}

export function Navbar({
  onMenuClick,
  avatarUrl,
  fullName = "Guest",
  role = "student",
  profile,
}: NavbarProps) {
  const colors = getRoleColorScheme(role);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 lg:hidden"
          aria-label="Toggle navigation"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell primaryColor={colors.primary} />

        <Link
          href="/ai/chat-assistant"
          className="hidden items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors md:flex"
          style={{
            borderColor: colors.primary,
            color: colors.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Ask AI
        </Link>

        {profile && <UserInfoDropdown profile={profile} role={role} />}

        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
            ) : (
              fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{fullName}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>

        <div className="hidden md:block">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
