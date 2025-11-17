import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CreateCourseForm } from "./create-course-form";
import type { CreateCourseActionState } from "./types";
import { createCourse } from "@/app/actions/courses";

export const metadata = {
  title: "Create Course | AI LMS",
};

export default async function CreateCoursePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (currentUser.role !== "teacher") {
    redirect("/teacher/dashboard");
  }

  return (
    <DashboardShell role="teacher">
      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Course builder
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Create a new course
          </h1>
          <p className="text-sm text-slate-500">
            Configure course metadata, schedule, and publish it for students.
          </p>
        </div>
        <CreateCourseForm
          teacherName={currentUser.fullName}
          action={createCourseAction}
        />
      </section>
    </DashboardShell>
  );
}

const createCourseAction = async (
  _prevState: CreateCourseActionState,
  formData: FormData,
): Promise<CreateCourseActionState> => {
  "use server";

  const courseName = formData.get("course_name")?.toString().trim();
  const courseCode = formData.get("course_code")?.toString().trim();

  if (!courseName) {
    return { error: "Course name is required." };
  }

  if (!courseCode) {
    return { error: "Course code is required." };
  }

  const result = await createCourse({
    course_name: courseName,
    course_code: courseCode,
  });

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/teacher/courses");
};
