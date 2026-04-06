"use client";

import { useRouter } from "next/navigation";
import type { CourseWithTeacher } from "@/app/actions/enrollments";

interface CourseFilterProps {
  courses: CourseWithTeacher[];
  selectedCourseId?: string;
}

export function CourseFilter({ courses, selectedCourseId }: CourseFilterProps) {
  const router = useRouter();

  const handleCourseChange = (courseId: string) => {
    const url = new URL(window.location.href);
    if (courseId) {
      url.searchParams.set("course", courseId);
    } else {
      url.searchParams.delete("course");
    }
    router.push(url.toString());
  };

  return (
    <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <label
        htmlFor="course-filter"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Filter by Course:
      </label>
      <select
        id="course-filter"
        value={selectedCourseId || ""}
        onChange={(e) => handleCourseChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
      >
        <option value="">All Courses</option>
        {courses.map((course) => (
          <option key={course.course_id} value={course.course_id}>
            {course.course_name} ({course.course_code})
          </option>
        ))}
      </select>
    </div>
  );
}

