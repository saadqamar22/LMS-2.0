import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { getTeacherStats } from "@/app/actions/teacher-stats";
import { GraduationCap, Users } from "lucide-react";

export default async function TeacherDashboardPage() {
  const statsResult = await getTeacherStats();

  const stats = statsResult.success ? statsResult.stats : {
    totalCourses: 0,
    totalStudents: 0,
    recentCourses: [],
  };

  return (
    <DashboardShell role="teacher">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Overview</p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        </div>
        <Link
          href="/teacher/create-course"
          className="self-start rounded-2xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
        >
          + Create Course
        </Link>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <DashboardCard
          title="Total Students"
          value={stats.totalStudents.toString()}
          subtitle="Across all courses"
          icon={<Users className="h-5 w-5" />}
        />
        <DashboardCard
          title="Total Courses"
          value={stats.totalCourses.toString()}
          subtitle="Active courses"
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </section>

      {stats.recentCourses.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Courses</p>
              <h2 className="text-xl font-semibold text-slate-900">Your Courses</h2>
            </div>
            <Link
              href="/teacher/courses"
              className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {stats.recentCourses.map((course) => (
              <CourseCard
                key={course.course_id}
                courseId={course.course_id}
                title={course.course_name}
                code={course.course_code}
                teacher={""}
                students={course.student_count}
                tags={[]}
                href={`/teacher/courses/${course.course_id}`}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <EmptyState
            title="No courses yet"
            description="Create your first course to start teaching."
            actionLabel="Create Course"
            actionHref="/teacher/create-course"
          />
        </section>
      )}
    </DashboardShell>
  );
}

