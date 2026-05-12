import { User, BookOpen } from "lucide-react";
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
    parents: "bg-emerald-50 text-emerald-700",
    both: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {announcement.teacher_name}
            </span>
            {announcement.course_name && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {announcement.course_code} — {announcement.course_name}
                </span>
                <span>·</span>
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
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${audienceColors[announcement.audience]}`}
        >
          {audienceLabels[announcement.audience]}
        </span>
      </div>
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {announcement.content}
        </p>
      </div>
    </div>
  );
}
