import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-slate-400">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--role-primary)" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
