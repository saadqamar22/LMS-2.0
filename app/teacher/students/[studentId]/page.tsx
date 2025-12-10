import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTeacherCourses } from "@/app/actions/courses";
import { getAllMarksForCourse } from "@/app/actions/marks";
import type { AttendanceStatus } from "@/app/actions/attendance";
import { getCourseAssignments } from "@/app/actions/assignments";
import { getAssignmentSubmissions } from "@/app/actions/submissions";
import { calculateGPAFromMarks } from "@/lib/utils/gpa-calculator";
import { GraduationCap, BookOpen, Calendar, FileText, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GPADisplay } from "@/components/gpa-display";

interface StudentDetailPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (currentUser.role !== "teacher") {
    redirect("/teacher/dashboard");
  }

  const supabase = createAdminClient();

  // Get student info
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select(`
      id,
      registration_number,
      class,
      section,
      users!students_id_fkey (
        full_name,
        email
      )
    `)
    .eq("id", studentId)
    .single();

  if (studentError || !studentData) {
    return (
      <DashboardShell role="teacher">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          Student not found.
        </div>
      </DashboardShell>
    );
  }

  const studentDataTyped = studentData as {
    id: string;
    registration_number: string | null;
    class: string | null;
    section: string | null;
    users: { full_name: string | null; email: string | null } | null;
  };

  const student = {
    id: studentDataTyped.id,
    full_name: studentDataTyped.users?.full_name || "Unknown",
    email: studentDataTyped.users?.email || "",
    registration_number: studentDataTyped.registration_number,
    class: studentDataTyped.class,
    section: studentDataTyped.section,
  };

  // Get teacher's courses
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

  const teacherCourses = coursesResult.courses;

  // Get enrollments for this student in teacher's courses
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(`
      course_id,
      courses!enrollments_course_id_fkey (
        course_id,
        course_name,
        course_code
      )
    `)
    .eq("student_id", studentId)
    .in("course_id", teacherCourses.map(c => c.course_id));

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError);
  }

  const enrolledCourses = (enrollments || [])
    .map((e: any) => ({
      course_id: e.course_id,
      course_name: e.courses?.course_name || "Unknown",
      course_code: e.courses?.course_code || "Unknown",
    }))
    .filter((c: any) => c.course_id);

  // Fetch data for each course
  const courseDataPromises = enrolledCourses.map(async (course) => {
    // Get marks
    const marksResult = await getAllMarksForCourse(course.course_id);
    const studentMarks = marksResult.success
      ? marksResult.marks.filter(m => m.student_id === studentId)
      : [];

    // Get attendance for this student in this course
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .select(`
        attendance_id,
        student_id,
        course_id,
        date,
        status
      `)
      .eq("student_id", studentId)
      .eq("course_id", course.course_id)
      .order("date", { ascending: false });

    const studentAttendance = (attendanceData || []).map((a: {
      attendance_id: string;
      student_id: string;
      course_id: string;
      date: string;
      status: AttendanceStatus;
    }) => ({
      attendance_id: a.attendance_id,
      student_id: a.student_id,
      course_id: a.course_id,
      date: a.date,
      status: a.status,
    }));

    // Calculate attendance rate
    const totalRecords = studentAttendance.length;
    const presentCount = studentAttendance.filter(a => a.status === "present").length;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Get assignments
    const assignmentsResult = await getCourseAssignments(course.course_id);
    const assignments = assignmentsResult.success ? assignmentsResult.assignments : [];

    // Get submissions for each assignment
    const submissionsPromises = assignments.map(async (assignment) => {
      const submissionsResult = await getAssignmentSubmissions(assignment.assignment_id);
      const submission = submissionsResult.success
        ? submissionsResult.submissions.find(s => s.student_id === studentId)
        : null;
      return { assignment, submission };
    });

    const assignmentSubmissions = await Promise.all(submissionsPromises);

    // Calculate GPA for this course
    const courseMarks = studentMarks.map(m => ({
      obtained_marks: m.obtained_marks,
      module_total_marks: m.module_total_marks ?? null,
    }));
    const { gpa, percentage } = calculateGPAFromMarks(courseMarks);

    return {
      course,
      marks: studentMarks,
      attendance: studentAttendance,
      attendanceRate,
      assignments: assignmentSubmissions,
      gpa,
      percentage,
    };
  });

  const courseData = await Promise.all(courseDataPromises);

  return (
    <DashboardShell role="teacher">
      <div className="space-y-6">
        {/* Student Info Header */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#EEF2FF] p-3 text-[#4F46E5]">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-slate-900">{student.full_name}</h1>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {student.registration_number && (
                  <p>Registration: {student.registration_number}</p>
                )}
                <p>Class: {student.class} - Section {student.section}</p>
                <p>Email: {student.email}</p>
              </div>
            </div>
            <Link
              href="/teacher/students"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← Back to Students
            </Link>
          </div>
        </div>

        {/* Course Information */}
        {courseData.length === 0 ? (
          <EmptyState
            title="No courses found"
            description="This student is not enrolled in any of your courses."
          />
        ) : (
          <div className="space-y-6">
            {courseData.map(({ course, marks, attendance, attendanceRate, assignments, gpa, percentage }) => (
              <div
                key={course.course_id}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                {/* Course Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#4F46E5]" />
                      <h2 className="text-xl font-semibold text-slate-900">{course.course_name}</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{course.course_code}</p>
                  </div>
                  <Link
                    href={`/teacher/courses/${course.course_id}`}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Course →
                  </Link>
                </div>

                {/* Stats Grid */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* GPA/Percentage */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Award className="h-4 w-4" />
                      <span className="text-sm font-medium">Performance</span>
                    </div>
                    <div className="mt-2">
                      <GPADisplay gpa={gpa} percentage={percentage} size="lg" />
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Attendance</span>
                    </div>
                    <div className="mt-2">
                      <p className={`text-2xl font-semibold ${attendanceRate < 80 ? 'text-red-600' : 'text-slate-900'}`}>
                        {attendanceRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {attendance.filter(a => a.status === "present").length} present out of {attendance.length} records
                      </p>
                    </div>
                  </div>

                  {/* Assignments */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Assignments</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-2xl font-semibold text-slate-900">
                        {assignments.filter(a => a.submission).length} / {assignments.length}
                      </p>
                      <p className="text-xs text-slate-500">Submitted</p>
                    </div>
                  </div>
                </div>

                {/* Marks Section */}
                {marks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <TrendingUp className="h-4 w-4" />
                      Marks
                    </h3>
                    <div className="space-y-2">
                      {marks.map((mark) => (
                        <div
                          key={mark.mark_id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{mark.module_name}</p>
                            {mark.module_total_marks && (
                              <p className="text-xs text-slate-500">
                                Total: {mark.module_total_marks} marks
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {mark.obtained_marks} / {mark.module_total_marks || "N/A"}
                            </p>
                            {mark.module_total_marks && (
                              <p className="text-xs text-slate-500">
                                {((mark.obtained_marks / mark.module_total_marks) * 100).toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignments Section */}
                {assignments.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FileText className="h-4 w-4" />
                      Assignments
                    </h3>
                    <div className="space-y-2">
                      {assignments.map(({ assignment, submission }) => (
                        <div
                          key={assignment.assignment_id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{assignment.title}</p>
                            <p className="text-xs text-slate-500">
                              Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {submission ? (
                              <>
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                  Submitted
                                </span>
                                {submission.marks !== null && (
                                  <span className="text-sm font-semibold text-slate-900">
                                    {submission.marks} / 100
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                                Not Submitted
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
