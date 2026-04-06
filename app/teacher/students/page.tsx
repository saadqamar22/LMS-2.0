import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { getTeacherCourses } from "@/app/actions/courses";
import { getEnrolledStudentsForCourse } from "@/app/actions/enrollments";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { BookOpen, GraduationCap } from "lucide-react";
import type { EnrolledStudent } from "@/app/actions/enrollments";

interface StudentWithCourses extends EnrolledStudent {
  courses: Array<{
    course_id: string;
    course_name: string;
    course_code: string;
  }>;
}

export default async function TeacherStudentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const coursesResult = await getTeacherCourses();

  if (!coursesResult.success) {
    return (
      <DashboardShell role="teacher">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {coursesResult.error}
        </div>
      </DashboardShell>
    );
  }

  const courses = coursesResult.courses;

  // Fetch all students across all courses
  const allStudentsMap = new Map<string, StudentWithCourses>();

  for (const course of courses) {
    const studentsResult = await getEnrolledStudentsForCourse(course.course_id);
    if (studentsResult.success) {
      for (const student of studentsResult.students) {
        const existing = allStudentsMap.get(student.student_id);
        if (existing) {
          // Add course to existing student
          existing.courses.push({
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
          });
        } else {
          // Create new entry
          allStudentsMap.set(student.student_id, {
            ...student,
            courses: [
              {
                course_id: course.course_id,
                course_name: course.course_name,
                course_code: course.course_code,
              },
            ],
          });
        }
      }
    }
  }

  const allStudents = Array.from(allStudentsMap.values());

  // Sort by name
  allStudents.sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <DashboardShell role="teacher">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          All Students ({allStudents.length})
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View all students enrolled in your courses
        </p>
      </section>

      {allStudents.length === 0 ? (
        <EmptyState
          title="No students enrolled"
          description="Students will appear here once they enroll in your courses."
        />
      ) : (
        <div className="space-y-4">
          {allStudents.map((student) => (
            <Link
              key={student.student_id}
              href={`/teacher/students/${student.student_id}`}
              className="block rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition hover:shadow-lg hover:border-[#4F46E5]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#EEF2FF] p-3 text-[#4F46E5]">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {student.full_name}
                    </h3>
                    {student.registration_number && (
                      <p className="mt-1 text-sm text-slate-500">
                        Registration: {student.registration_number}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {student.courses.map((course) => (
                        <span
                          key={course.course_id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {course.course_code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-medium text-slate-600">
                    {student.courses.length} course
                    {student.courses.length !== 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">View Details →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
