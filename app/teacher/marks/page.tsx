import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getTeacherCourses } from "@/app/actions/courses";
import { MarksEntryForm } from "./marks-entry-form";

interface TeacherMarksPageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function TeacherMarksPage({
  searchParams,
}: TeacherMarksPageProps) {
  const { course: selectedCourseId } = await searchParams;
  const coursesResult = await getTeacherCourses();

  if (!coursesResult.success) {
    return (
      <DashboardShell role="teacher">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Gradebook
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Marks & Evaluations
            </h1>
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {coursesResult.error}
        </div>
      </DashboardShell>
    );
  }

  const courses = coursesResult.courses;

  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Gradebook
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Marks & Evaluations
          </h1>
          <p className="text-sm text-slate-500">
            Select a course to enter marks for your students
          </p>
        </div>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="You need to create a course before you can enter marks. Go to 'My Courses' to create one."
        />
      ) : (
        <MarksEntryForm
          courses={courses}
          selectedCourseId={selectedCourseId}
        />
      )}
    </DashboardShell>
  );
}
