interface Announcement {
  id: string;
  title: string;
  author: string;
  date: string;
  tag?: string;
}

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Updates
          </p>
          <h3 className="text-lg font-semibold text-slate-900">Announcements</h3>
        </div>
        <button className="text-sm font-semibold text-[#4F46E5]">
          View all
        </button>
      </div>
      <div className="mt-6 space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{announcement.author}</span>
              <span>{announcement.date}</span>
            </div>
            <p className="mt-2 font-medium text-slate-800">
              {announcement.title}
            </p>
            {announcement.tag && (
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {announcement.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

