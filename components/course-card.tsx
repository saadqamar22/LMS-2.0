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
  tags = [],
  href,
}: CourseCardProps) {
  const cardContent = (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50/50">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <BookOpen className="h-4 w-4 text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-400">{code}</p>
          <p className="mt-0.5 font-semibold leading-snug text-slate-900">{title}</p>
        </div>
      </div>

      {teacher && (
        <p className="mt-3 text-xs text-slate-500">Instructor: {teacher}</p>
      )}

      <div className="mt-3 flex items-center text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {students} {students === 1 ? "student" : "students"}
        </span>
      </div>

      {!!tags.length && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
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
