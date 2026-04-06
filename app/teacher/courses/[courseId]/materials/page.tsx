import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseById } from "@/app/actions/courses";
import { getMaterialsByCourse } from "@/app/actions/materials";
import { TeacherMaterialsClient } from "./materials-client";
import { ArrowLeft, FileText, Video, Link as LinkIcon, Image, File } from "lucide-react";
import Link from "next/link";

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

export default async function TeacherMaterialsPage({ params }: PageProps) {
  const { courseId } = await params;
  const [courseResult, materialsResult] = await Promise.all([
    getCourseById(courseId),
    getMaterialsByCourse(courseId),
  ]);

  if (!courseResult.success) notFound();

  const course = courseResult.course;
  const materials = materialsResult.success ? materialsResult.materials : [];

  return (
    <DashboardShell role="teacher">
      <section className="flex items-center gap-4">
        <Link
          href={`/teacher/courses/${courseId}`}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{course.course_code}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Course Materials</h1>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Add New Material</h2>
            <TeacherMaterialsClient courseId={courseId} />
          </div>
        </div>

        {/* Materials List */}
        <div className="lg:col-span-2">
          {materials.length === 0 ? (
            <EmptyState
              title="No materials yet"
              description="Upload PDFs, videos, or add links for your students."
            />
          ) : (
            <div className="space-y-3">
              {materials.map((material) => {
                const Icon = TYPE_ICON[material.type] || File;
                const colorClass = TYPE_COLOR[material.type] || TYPE_COLOR.other;
                return (
                  <div
                    key={material.material_id}
                    className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)]"
                  >
                    <div className={`rounded-xl p-2.5 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{material.title}</p>
                      {material.description && (
                        <p className="mt-0.5 text-sm text-slate-500 truncate">{material.description}</p>
                      )}
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{material.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {material.type === "link" && material.external_url ? (
                        <a
                          href={material.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Open
                        </a>
                      ) : material.file_url ? (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </a>
                      ) : null}
                      <TeacherMaterialsClient
                        courseId={courseId}
                        deleteId={material.material_id}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
