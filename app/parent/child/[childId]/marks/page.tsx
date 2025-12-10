import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getChildMarks } from "@/app/actions/marks";
import { verifyChildAccess } from "@/app/actions/parents";
import { GraduationCap, TrendingUp } from "lucide-react";
import { calculateGPAFromMarks } from "@/lib/utils/gpa-calculator";
import { GPADisplay } from "@/components/gpa-display";

interface ChildMarksPageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildMarksPage({
  params,
}: ChildMarksPageProps) {
  const { childId } = await params;
  const [accessResult, marksResult] = await Promise.all([
    verifyChildAccess(childId),
    getChildMarks(childId),
  ]);

  if ("success" in accessResult) {
    notFound();
  }

  if (!accessResult.hasAccess) {
    notFound();
  }

  if (!marksResult.success) {
    return (
      <DashboardShell role="parent">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/parent/children"
              className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
            >
              ← Back to children
            </Link>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
              {accessResult.childName}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Marks</h1>
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {marksResult.error}
        </div>
      </DashboardShell>
    );
  }

  const marks = marksResult.marks;

  // Group by course - use course_code as key since course_id is not in marks table
  const marksByCourse = marks.reduce(
    (acc, mark) => {
      const courseKey = mark.course_code || "unknown";
      if (!acc[courseKey]) {
        acc[courseKey] = {
          course_name: mark.course_name || "Unknown Course",
          course_code: mark.course_code || "N/A",
          marks: [],
        };
      }
      acc[courseKey].marks.push(mark);
      return acc;
    },
    {} as Record<
      string,
      {
        course_name: string;
        course_code: string;
        marks: typeof marks;
      }
    >,
  );

  // Calculate overall GPA and percentage
  const { gpa: overallGPA, percentage: overallPercentage } = calculateGPAFromMarks(marks);

  return (
    <DashboardShell role="parent">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/parent/children"
            className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
          >
            ← Back to children
          </Link>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
            {accessResult.childName}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Marks</h1>
          <p className="text-sm text-slate-500">
            View all marks and grades for your child
          </p>
        </div>
      </section>

      {marks.length === 0 ? (
        <EmptyState
          title="No marks yet"
          description="Your child doesn't have any marks recorded yet. Once teachers enter marks, they will appear here."
        />
      ) : (
        <>
          <section className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Modules
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {marks.length}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Overall GPA / Percentage
              </p>
              <div className="mt-2">
                <GPADisplay gpa={overallGPA} percentage={overallPercentage} size="lg" showToggle={true} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Courses
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {Object.keys(marksByCourse).length}
              </p>
            </div>
          </section>

          <section className="mt-8 space-y-6">
            {Object.entries(marksByCourse).map(([courseId, courseData]) => {
              // Calculate course-specific GPA and percentage
              const { gpa: courseGPA, percentage: coursePercentage } = calculateGPAFromMarks(courseData.marks);

              return (
                <div
                  key={courseId}
                  className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {courseData.course_code}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {courseData.course_name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {courseData.marks.length} module
                        {courseData.marks.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-[#EEF2FF] px-4 py-2">
                      <GPADisplay gpa={courseGPA} percentage={coursePercentage} size="md" showToggle={true} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {courseData.marks.map((mark) => {
                      const obtainedMarks = mark.obtained_marks;
                      const totalMarks = mark.module_total_marks;
                      const percentage =
                        typeof obtainedMarks === "number" &&
                        typeof totalMarks === "number" &&
                        totalMarks > 0
                          ? Math.round((obtainedMarks / totalMarks) * 100)
                          : null;
                      return (
                        <div
                          key={mark.mark_id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-slate-100 p-2">
                                <GraduationCap className="h-4 w-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {mark.module_name}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {mark.obtained_marks !== null &&
                            mark.module_total_marks !== null ? (
                              <>
                                <p className="text-lg font-semibold text-slate-900">
                                  {mark.obtained_marks} / {mark.module_total_marks}
                                </p>
                                {percentage !== null && (
                                  <p className="text-xs text-slate-500">
                                    {percentage}%
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-slate-400">Not graded</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </DashboardShell>
  );
}
