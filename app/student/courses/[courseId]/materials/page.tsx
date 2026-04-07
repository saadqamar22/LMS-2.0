import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getCourseById } from "@/app/actions/courses";
import { getMaterialsByCourse } from "@/app/actions/materials";
import { ArrowLeft } from "lucide-react";
import { MaterialCardWithAI } from "./material-card-ai";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

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
        <>
          <p className="text-sm text-slate-500">
            Click any file material to open it, or use the AI buttons to generate practice quizzes, study notes, or summaries.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <MaterialCardWithAI key={material.material_id} material={material} />
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
