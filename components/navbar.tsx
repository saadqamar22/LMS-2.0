import { Bell, Menu, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./logout-button";

interface NavbarProps {
  onMenuClick?: () => void;
  avatarUrl?: string;
  fullName?: string;
  role?: string;
}

export function Navbar({
  onMenuClick,
  avatarUrl,
  fullName = "Guest",
  role = "Member",
}: NavbarProps) {
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
        <div className="relative hidden w-64 items-center rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm md:flex">
          <Search className="mr-2 h-4 w-4 text-slate-400" />
          <input
            className="w-full border-none bg-transparent text-sm text-slate-600 outline-none"
            placeholder="Search courses, students, modules..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-[#4F46E5]">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </button>
        <Link
          href="/ai/chat-assistant"
          className="hidden rounded-full bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-[#4338CA] md:block"
        >
          Ask AI
        </Link>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1]">
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

