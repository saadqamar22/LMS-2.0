import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCourseById } from "@/app/actions/courses";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";
import { getModulesForCourse, getMarksForCourse } from "@/app/actions/marks";
import { MarksForm } from "./marks-form";

interface MarksPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ module?: string }>;
}

export default async function TeacherMarksPage({
  params,
  searchParams,
}: MarksPageProps) {
  const { courseId } = await params;
  const { module: selectedModuleId } = await searchParams;

  const [courseResult, studentsResult, modulesResult, marksResult] =
    await Promise.all([
      getCourseById(courseId),
      getEnrolledStudentsForCourse(courseId),
      getModulesForCourse(courseId),
      selectedModuleId
        ? getMarksForCourse(courseId, selectedModuleId)
        : Promise.resolve({ success: true, marks: [] }),
    ]);

  if (!courseResult.success) {
    if (
      courseResult.error.includes("not found") ||
      courseResult.error.includes("permission")
    ) {
      notFound();
    }
    return (
      <DashboardShell role="teacher">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {courseResult.error}
        </div>
      </DashboardShell>
    );
  }

  const course = courseResult.course;
  const students = studentsResult.success ? studentsResult.students : [];
  const modules = modulesResult.success ? modulesResult.modules : [];
  const existingMarks = marksResult.success ? marksResult.marks : [];

  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href={`/teacher/courses/${courseId}`}
            className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            ← Back to course
          </Link>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
            {course.course_code}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Enter Marks
          </h1>
        </div>
      </section>

      {modules.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
          No modules found for this course. Add modules before entering marks.
        </div>
      ) : students.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
          No students enrolled in this course yet. Students must enroll before
          you can enter marks.
        </div>
      ) : (
        <MarksForm
          courseId={courseId}
          students={students}
          modules={modules}
          selectedModuleId={selectedModuleId}
          existingMarks={existingMarks}
        />
      )}
    </DashboardShell>
  );
}
