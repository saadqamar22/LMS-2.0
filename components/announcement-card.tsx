import { Megaphone, User, BookOpen } from "lucide-react";
import type { Announcement } from "@/app/actions/announcements";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const audienceLabels = {
    students: "For Students",
    parents: "For Parents",
    both: "For Students & Parents",
  };

  const audienceColors = {
    students: "bg-blue-50 text-blue-700",
    parents: "bg-green-50 text-green-700",
    both: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {announcement.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <User className="h-3 w-3" />
              <span>{announcement.teacher_name}</span>
              <span>•</span>
              {announcement.course_name && (
                <>
                  <BookOpen className="h-3 w-3" />
                  <span>{announcement.course_code} - {announcement.course_name}</span>
                  <span>•</span>
                </>
              )}
              <span>
                {new Date(announcement.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${audienceColors[announcement.audience]}`}
          >
            {audienceLabels[announcement.audience]}
          </span>
          {!announcement.course_id && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              All Students
            </span>
          )}
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {announcement.content}
        </p>
      </div>
    </div>
  );
}

