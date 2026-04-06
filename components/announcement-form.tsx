"use client";

import { useState, FormEvent } from "react";
import { createAnnouncement, type AnnouncementAudience } from "@/app/actions/announcements";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { getRoleColorScheme } from "@/lib/utils/role-colors";
import type { Role } from "@/lib/auth/session";
import type { Course } from "@/app/actions/courses";

interface AnnouncementFormProps {
  courses?: Course[];
  onSuccess?: () => void;
  onCancel?: () => void;
  role?: Role;
}

export function AnnouncementForm({ courses = [], onSuccess, onCancel, role = "teacher" }: AnnouncementFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("both");
  const [courseId, setCourseId] = useState<string>("");
  const [isAllStudents, setIsAllStudents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = getRoleColorScheme(role);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!isAllStudents && !courseId) {
      setError("Please select a course or check 'All Students'.");
      setLoading(false);
      return;
    }

    const result = await createAnnouncement({
      title,
      content,
      audience,
      course_id: isAllStudents ? null : (courseId || null),
      is_all_students: isAllStudents,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setTitle("");
    setContent("");
    setAudience("both");
    setCourseId("");
    setIsAllStudents(false);
    
    if (onSuccess) {
      onSuccess();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Create Announcement</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2"
            placeholder="Enter announcement title"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryLight}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-700">
            Content *
          </label>
          <textarea
            id="content"
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2"
            placeholder="Enter announcement content"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryLight}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Course Selection *
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllStudents}
                onChange={(e) => {
                  setIsAllStudents(e.target.checked);
                  if (e.target.checked) {
                    setCourseId("");
                  }
                }}
                className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
              />
              <span className="text-sm text-slate-700">
                All Students (regardless of course enrollment)
              </span>
            </label>
            {!isAllStudents && (
              <select
                id="course"
                required={!isAllStudents}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryLight}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isAllStudents
              ? "This announcement will be visible to all students and parents, regardless of course enrollment."
              : "Select a course to make this announcement visible only to students enrolled in that course."}
          </p>
        </div>

        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-slate-700">
            Audience *
          </label>
          <select
            id="audience"
            required
            value={audience}
            onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryLight}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <option value="students">Students Only</option>
            <option value="parents">Parents Only</option>
            <option value="both">Both Students and Parents</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Select who should see this announcement
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 4px 14px 0 ${colors.primary}40`,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.primary;
              }
            }}
          >
            {loading ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}

