import Link from "next/link";
import { CalendarDays, Paperclip } from "lucide-react";

interface AssignmentCardProps {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status?: "pending" | "submitted" | "graded";
  attachments?: number;
  href?: string;
}

const STATUS_STYLES: Record<
  NonNullable<AssignmentCardProps["status"]>,
  string
> = {
  pending: "bg-yellow-100 text-yellow-800",
  submitted: "bg-blue-100 text-blue-700",
  graded: "bg-green-100 text-green-700",
};

export function AssignmentCard({
  id,
  title,
  course,
  dueDate,
  status = "pending",
  attachments = 0,
  href = `/student/assignments/${id}`,
}: AssignmentCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {course}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Due {dueDate}
        </span>
        <span className="inline-flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          {attachments} files
        </span>
      </div>
    </Link>
  );
}

