import Link from "next/link";
import { BookOpen, Users } from "lucide-react";

interface CourseCardProps {
  courseId?: string;
  title: string;
  code: string;
  teacher?: string;
  students?: number;
  progress?: number;
  tags?: string[];
  href?: string;
}

export function CourseCard({
  title,
  code,
  teacher,
  students = 0,
  progress = 0,
  tags = [],
  href,
}: CourseCardProps) {
  const cardContent = (
    <div className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#EEF2FF] p-3 text-[#4F46E5]">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {code}
          </p>
          <p className="text-lg font-semibold text-slate-900">{title}</p>
        </div>
      </div>

      {teacher && (
        <p className="mt-4 text-sm text-slate-500">Instructor: {teacher}</p>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="h-4 w-4" />
          {students} students
        </span>
        <span>{progress}% complete</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!!tags.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

