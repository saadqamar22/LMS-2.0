"use client";

import { useState, useRef, useEffect } from "react";
import { Info, X, Mail, User, Briefcase, Phone, MapPin, Hash, Building, Award, BookOpen, Users, KeyRound, Copy, Check } from "lucide-react";
import type { UserProfile } from "@/app/actions/profile";
import type { Role } from "@/lib/auth/session";
import { getRoleColorScheme } from "@/lib/utils/role-colors";

interface UserInfoDropdownProps {
  profile: UserProfile;
  role?: Role;
}

export function UserInfoDropdown({ profile, role = "student" }: UserInfoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const colors = getRoleColorScheme(role);

  async function copyParentKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      const el = document.createElement("textarea");
      el.value = key;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const roleLabels = {
    student: "Student",
    teacher: "Teacher",
    parent: "Parent",
    admin: "Admin",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-slate-200 p-2 text-slate-500 transition"
        style={{
          borderColor: isOpen ? colors.primary : undefined,
          color: isOpen ? colors.primary : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.color = colors.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.color = '';
          }
        }}
        aria-label="View personal information"
      >
        <Info className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Personal Information
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600">Name:</span>
                  <span className="text-slate-900">{profile.full_name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600">Email:</span>
                  <span className="text-slate-900">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600">Role:</span>
                  <span className="text-slate-900">{roleLabels[profile.role]}</span>
                </div>
              </div>

              {/* Student Specific Information */}
              {profile.role === "student" && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Student Details
                  </h4>
                  {profile.registration_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Registration:</span>
                      <span className="text-slate-900">{profile.registration_number}</span>
                    </div>
                  )}
                  {profile.class && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Class:</span>
                      <span className="text-slate-900">{profile.class}</span>
                    </div>
                  )}
                  {profile.section && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Section:</span>
                      <span className="text-slate-900">{profile.section}</span>
                    </div>
                  )}
                  {/* Parent Key — always show so student can share it */}
                  {profile.parent_key && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">
                          {profile.parent_id ? "Parent Key (linked)" : "Parent Key — share with your parent"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-white px-3 py-1.5 text-sm font-bold tracking-[0.2em] text-blue-900 border border-blue-200">
                          {profile.parent_key}
                        </code>
                        <button
                          onClick={() => copyParentKey(profile.parent_key!)}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                            keyCopied
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {keyCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {keyCopied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      {!profile.parent_id && (
                        <p className="mt-1.5 text-xs text-blue-600">
                          No parent linked yet. Share this key when your parent registers.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Specific Information */}
              {profile.role === "teacher" && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Teacher Details
                  </h4>
                  {profile.employee_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Employee ID:</span>
                      <span className="text-slate-900">{profile.employee_id}</span>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Department:</span>
                      <span className="text-slate-900">{profile.department}</span>
                    </div>
                  )}
                  {profile.designation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Designation:</span>
                      <span className="text-slate-900">{profile.designation}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Parent Specific Information */}
              {profile.role === "parent" && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Parent Details
                  </h4>
                  {profile.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Phone:</span>
                      <span className="text-slate-900">{profile.phone_number}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-medium text-slate-600">Address: </span>
                        <span className="text-slate-900">{profile.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

