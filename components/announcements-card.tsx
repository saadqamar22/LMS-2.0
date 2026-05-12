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
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Announcements</h3>
        <button className="text-sm font-medium text-slate-500 hover:text-slate-700">
          View all
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-lg border border-slate-100 p-4 transition hover:bg-slate-50"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{announcement.author}</span>
              <span>{announcement.date}</span>
            </div>
            <p className="mt-2 font-medium text-slate-800">
              {announcement.title}
            </p>
            {announcement.tag && (
              <span className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {announcement.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

