"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnnouncementForm } from "@/components/announcement-form";
import { AnnouncementCard } from "@/components/announcement-card";
import { EmptyState } from "@/components/empty-state";
import { Plus } from "lucide-react";
import type { Announcement } from "@/app/actions/announcements";
import { getTeacherAnnouncements } from "@/app/actions/announcements";
import { getRoleColorScheme } from "@/lib/utils/role-colors";
import type { Course } from "@/app/actions/courses";

interface AnnouncementsPageClientProps {
  initialAnnouncements: Announcement[];
  courses: Course[];
  error: string | null;
}

export function AnnouncementsPageClient({
  initialAnnouncements,
  courses,
  error,
}: AnnouncementsPageClientProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [loading, setLoading] = useState(false);
  const colors = getRoleColorScheme("teacher");

  // Update announcements when initialAnnouncements changes (after refresh)
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  const handleSuccess = async () => {
    setShowCreateForm(false);
    setLoading(true);
    
    // Fetch the latest announcements
    const result = await getTeacherAnnouncements();
    if (result.success) {
      setAnnouncements(result.announcements);
    }
    
    setLoading(false);
    // Also refresh the page to ensure server state is updated
    router.refresh();
  };

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg"
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
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Cancel" : "Create Announcement"}
        </button>
      </div>

      {showCreateForm && (
        <AnnouncementForm
          courses={courses}
          onSuccess={handleSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {loading ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
          Refreshing announcements...
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Create your first announcement to communicate with students and parents."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.announcement_id}
              announcement={announcement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

