import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/get-session";
import { generateText } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "parent")
    return NextResponse.json({ error: "Only parents can generate reports." }, { status: 403 });

  const { studentId } = await request.json();
  if (!studentId) return NextResponse.json({ error: "Student ID is required." }, { status: 400 });

  try {
    const supabase = createAdminClient();

    const { data: student } = await supabase
      .from("students")
      .select("id, parent_id, class, section, users!students_id_fkey(full_name)")
      .eq("id", studentId)
      .eq("parent_id", session.userId)
      .single();

    if (!student) return NextResponse.json({ error: "Student not found or access denied." }, { status: 403 });

    const s = student as any;
    const studentName = s.users?.full_name || "Student";

    const { data: marks } = await supabase
      .from("marks")
      .select(`obtained_marks, modules!marks_module_id_fkey(module_name, total_marks, courses!modules_course_id_fkey(course_name, course_code))`)
      .eq("student_id", studentId);

    const { data: attendance } = await supabase
      .from("attendance")
      .select("status, date")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(90);

    const attendanceList = (attendance || []) as any[];
    const totalRecords = attendanceList.length;
    const presentCount = attendanceList.filter(a => a.status === "present").length;
    const lateCount = attendanceList.filter(a => a.status === "late").length;
    const absentCount = attendanceList.filter(a => a.status === "absent").length;
    const attendanceRate = totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
      : null;

    const courseMap: Record<string, { courseName: string; courseCode: string; modules: { name: string; obtained: number; total: number; pct: number }[] }> = {};
    for (const mark of (marks || []) as any[]) {
      const mod = mark.modules;
      if (!mod) continue;
      const course = mod.courses;
      const key = course?.course_code || "unknown";
      if (!courseMap[key]) {
        courseMap[key] = { courseName: course?.course_name || "Unknown", courseCode: key, modules: [] };
      }
      const pct = mod.total_marks > 0 ? Math.round((mark.obtained_marks / mod.total_marks) * 100) : 0;
      courseMap[key].modules.push({ name: mod.module_name, obtained: mark.obtained_marks, total: mod.total_marks, pct });
    }

    const coursesSummary = Object.values(courseMap).map(c => {
      const avgPct = c.modules.length > 0
        ? Math.round(c.modules.reduce((s, m) => s + m.pct, 0) / c.modules.length)
        : null;
      return `${c.courseCode} - ${c.courseName}: ${c.modules.map(m => `${m.name} ${m.obtained}/${m.total} (${m.pct}%)`).join(", ")}${avgPct !== null ? ` | Course avg: ${avgPct}%` : ""}`;
    }).join("\n");

    const prompt = `You are an academic advisor generating a parent-friendly progress report for a student.

Student: ${studentName}
Class: ${s.class || "N/A"} | Section: ${s.section || "N/A"}

ACADEMIC PERFORMANCE:
${coursesSummary || "No marks recorded yet."}

ATTENDANCE (last 90 days):
Total: ${totalRecords} records | Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount}
Attendance rate: ${attendanceRate !== null ? `${attendanceRate}%` : "No data"}

Write a comprehensive, warm, and constructive parent report in markdown format. Include:
1. **Overall Assessment** — brief overall summary (2-3 sentences)
2. **Academic Performance** — subject-by-subject analysis with strengths and areas for improvement
3. **Attendance** — comment on attendance pattern
4. **Strengths** — what the student is doing well
5. **Areas for Improvement** — specific actionable suggestions
6. **Recommendations** — 3-4 practical tips for the parent to support their child

Keep the tone encouraging and professional. Write as if addressed directly to the parent.`;

    const report = await generateText(prompt);
    return NextResponse.json({ report, studentName });
  } catch (err) {
    console.error("AI parent report error:", err);
    return NextResponse.json({ error: "Failed to generate report. Please try again." }, { status: 500 });
  }
}
