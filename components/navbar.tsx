"use client";

import { Bell, Menu, Info, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./logout-button";
import { UserInfoDropdown } from "./user-info-dropdown";
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          className="rounded-full border border-slate-200 p-2 text-slate-600 lg:hidden"
          aria-label="Toggle navigation"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300"
          style={{ 
            color: colors.primary,
            '--hover-color': colors.primaryHover,
          } as React.CSSProperties & { '--hover-color': string }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.primary;
          }}
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </button>
        <Link
          href="/ai/chat-assistant"
          className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition md:block"
          style={{ 
            backgroundColor: colors.primary,
            boxShadow: `0 4px 14px 0 ${colors.primary}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          Ask AI
        </Link>
        {profile && <UserInfoDropdown profile={profile} role={role} />}
        <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2">
          <div 
            className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br text-white"
            style={{
              background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryHover})`,
            }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{fullName}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
        </div>
        <div className="hidden md:block">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

