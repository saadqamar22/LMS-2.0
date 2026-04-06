import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseById } from "@/app/actions/courses";
import { getMaterialsByCourse } from "@/app/actions/materials";
import { ArrowLeft, FileText, Video, Link as LinkIcon, Image, File, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  video: Video,
  link: LinkIcon,
  image: Image,
  other: File,
};

const TYPE_COLOR: Record<string, string> = {
  pdf: "bg-red-50 text-red-600",
  video: "bg-blue-50 text-blue-600",
  link: "bg-green-50 text-green-600",
  image: "bg-yellow-50 text-yellow-600",
  other: "bg-slate-50 text-slate-600",
};

export default async function StudentMaterialsPage({ params }: PageProps) {
  const { courseId } = await params;
  const [courseResult, materialsResult] = await Promise.all([
    getCourseById(courseId),
    getMaterialsByCourse(courseId),
  ]);

  if (!courseResult.success) notFound();

  const course = courseResult.course;
  const materials = materialsResult.success ? materialsResult.materials : [];

  return (
    <DashboardShell role="student">
      <section className="flex items-center gap-4">
        <Link
          href={`/student/courses/${courseId}`}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{course.course_code}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Course Materials</h1>
        </div>
      </section>

      {materials.length === 0 ? (
        <EmptyState
          title="No materials yet"
          description="Your teacher hasn't uploaded any materials for this course yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const Icon = TYPE_ICON[material.type] || File;
            const colorClass = TYPE_COLOR[material.type] || TYPE_COLOR.other;
            const href =
              material.type === "link"
                ? material.external_url || "#"
                : material.file_url || "#";
            const isExternal = material.type === "link";

            return (
              <a
                key={material.material_id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`rounded-xl p-2.5 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 line-clamp-2">{material.title}</p>
                  {material.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{material.description}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {material.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {material.created_at
                      ? new Date(material.created_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
