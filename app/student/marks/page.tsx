import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getStudentMarks, getStudentModuleStatistics } from "@/app/actions/marks";
import { GraduationCap, TrendingUp } from "lucide-react";

interface StudentMarksPageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function StudentMarksPage({
  searchParams,
}: StudentMarksPageProps) {
  const { course } = await searchParams;
  const result = await getStudentMarks(course);

  if (!result.success) {
    return (
      <DashboardShell role="student">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Grades
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">My Marks</h1>
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {result.error}
        </div>
      </DashboardShell>
    );
  }

  const marks = result.marks;

  // Fetch statistics for each unique module
  const moduleStatsMap = new Map<string, ModuleStatistics | null>();
  const uniqueModuleIds = [...new Set(marks.map((m) => m.module_id))];
  
  await Promise.all(
    uniqueModuleIds.map(async (moduleId) => {
      const statsResult = await getStudentModuleStatistics(moduleId);
      moduleStatsMap.set(
        moduleId,
        statsResult.success ? statsResult.statistics : null,
      );
    }),
  );

  // Add statistics to each mark
  const marksWithStats = marks.map((mark) => ({
    ...mark,
    moduleStatistics: moduleStatsMap.get(mark.module_id) || null,
  }));

  // Group by course - use course_code as key since course_id is not in marks table
  const marksByCourse = marksWithStats.reduce(
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
        marks: Array<typeof marks[0] & { moduleStatistics: ModuleStatistics | null }>;
      }
    >,
  );

  // Calculate overall statistics
  const totalMarks = marks.filter((m) => m.obtained_marks !== null && m.module_total_marks !== null);
  const totalObtained = totalMarks.reduce((sum, m) => sum + (m.obtained_marks || 0), 0);
  const totalPossible = totalMarks.reduce((sum, m) => sum + (m.module_total_marks || 0), 0);
  const overallPercentage =
    totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

  return (
    <DashboardShell role="student">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Grades
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">My Marks</h1>
          <p className="text-sm text-slate-500">
            {course
              ? "Viewing marks for selected course"
              : "View all your marks and grades"}
          </p>
        </div>
      </section>

      {marks.length === 0 ? (
        <EmptyState
          title="No marks yet"
          description="You don't have any marks recorded yet. Once your teachers enter marks, they will appear here."
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
                Overall Percentage
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {overallPercentage}%
              </p>
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
              const courseMarks = courseData.marks.filter(
                (m) => m.obtained_marks !== null && m.module_total_marks !== null,
              );
              const courseObtained = courseMarks.reduce(
                (sum, m) => sum + (m.obtained_marks || 0),
                0,
              );
              const coursePossible = courseMarks.reduce(
                (sum, m) => sum + (m.module_total_marks || 0),
                0,
              );
              const coursePercentage =
                coursePossible > 0
                  ? Math.round((courseObtained / coursePossible) * 100)
                  : 0;

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
                        {courseData.marks.length !== 1 ? "s" : ""} • {coursePercentage}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-[#EEF2FF] px-4 py-2">
                      <TrendingUp className="h-5 w-5 text-[#4F46E5]" />
                      <span className="text-lg font-semibold text-[#4F46E5]">
                        {coursePercentage}%
                      </span>
                    </div>
                  </div>
                  {/* Module Statistics */}
                  {courseData.marks.length > 0 &&
                    courseData.marks[0].moduleStatistics && (
                      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Class Statistics
                        </p>
                        <div className="grid grid-cols-5 gap-4 text-center text-xs font-medium text-slate-600">
                          <div>
                            <p>Average</p>
                            <p className="text-sm font-semibold text-[#4F46E5]">
                              {courseData.marks[0].moduleStatistics.average.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p>Std Dev</p>
                            <p className="text-sm font-semibold text-[#F59E0B]">
                              {courseData.marks[0].moduleStatistics.stdDeviation.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p>Min</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {courseData.marks[0].moduleStatistics.minMarks}
                            </p>
                          </div>
                          <div>
                            <p>Max</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {courseData.marks[0].moduleStatistics.maxMarks}
                            </p>
                          </div>
                          <div>
                            <p>Median</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {courseData.marks[0].moduleStatistics.medianMarks.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="space-y-3">
                    {courseData.marks.map((mark) => {
                      const percentage =
                        mark.obtained_marks !== null &&
                        mark.module_total_marks !== null &&
                        mark.module_total_marks > 0
                          ? Math.round(
                              ((mark.obtained_marks || 0) / mark.module_total_marks) * 100,
                            )
                          : null;
                      const diffFromAverage =
                        mark.moduleStatistics && mark.moduleStatistics.average > 0
                          ? mark.obtained_marks - mark.moduleStatistics.average
                          : null;

                      return (
                        <div
                          key={mark.mark_id}
                          className="rounded-xl border border-slate-100 bg-white p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-slate-100 p-2">
                                  <GraduationCap className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {mark.module_name}
                                  </p>
                                  {diffFromAverage !== null && (
                                    <p
                                      className={`mt-1 text-xs font-medium ${
                                        diffFromAverage >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {diffFromAverage >= 0 ? "+" : ""}
                                      {diffFromAverage.toFixed(2)} from class average
                                    </p>
                                  )}
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

