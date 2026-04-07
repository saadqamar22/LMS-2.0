import { Megaphone, User, BookOpen } from "lucide-react";
import type { Announcement } from "@/app/actions/announcements";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const audienceLabels = {
    students: "Students",
    parents: "Parents",
    both: "All",
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
                })}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${audienceColors[announcement.audience]}`}
        >
          {audienceLabels[announcement.audience]}
        </span>
      </div>
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {announcement.content}
        </p>
      </div>
    </div>
  );
}

