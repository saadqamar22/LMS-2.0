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

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: attendance } = await supabase
      .from("attendance")
      .select("status, date")
      .eq("student_id", studentId)
      .gte("date", sixMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    const attendanceList = (attendance || []) as any[];
    const totalRecords = attendanceList.length;
    const presentCount = attendanceList.filter(a => a.status === "present").length;
    const lateCount = attendanceList.filter(a => a.status === "late").length;
    const absentCount = attendanceList.filter(a => a.status === "absent").length;
    const attendanceRate = totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
      : null;

    // Group attendance by month (chronological order preserved)
    const monthOrder: string[] = [];
    const attendanceByMonth: Record<string, { present: number; absent: number; late: number }> = {};
    for (const record of attendanceList) {
      const monthKey = new Date(record.date).toLocaleString("default", { month: "short" });
      if (!attendanceByMonth[monthKey]) {
        attendanceByMonth[monthKey] = { present: 0, absent: 0, late: 0 };
        monthOrder.push(monthKey);
      }
      const status = record.status as "present" | "absent" | "late";
      if (status in attendanceByMonth[monthKey]) attendanceByMonth[monthKey][status]++;
    }
    const attendanceChartData = monthOrder.map(month => ({ month, ...attendanceByMonth[month] }));

    // Build course map
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
        ? Math.round(c.modules.reduce((sum, m) => sum + m.pct, 0) / c.modules.length)
        : null;
      return `${c.courseCode} - ${c.courseName}: ${c.modules.map(m => `${m.name} ${m.obtained}/${m.total} (${m.pct}%)`).join(", ")}${avgPct !== null ? ` | Course avg: ${avgPct}%` : ""}`;
    }).join("\n");

    const coursePerformanceData = Object.values(courseMap).map(c => ({
      course: c.courseCode,
      courseName: c.courseName,
      pct: c.modules.length > 0 ? Math.round(c.modules.reduce((sum, m) => sum + m.pct, 0) / c.modules.length) : 0,
    }));

    const bestCourse = coursePerformanceData.length > 0
      ? coursePerformanceData.reduce((best, c) => c.pct > best.pct ? c : best)
      : null;

    const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const prompt = `You are a professional academic advisor writing a formal progress report for a parent. Write a warm, thorough, and data-driven report.

Student: ${studentName}
Class: ${s.class || "N/A"} | Section: ${s.section || "N/A"}
Report Date: ${reportDate}

ACADEMIC PERFORMANCE:
${coursesSummary || "No marks recorded yet."}

ATTENDANCE (last 6 months):
Total Sessions: ${totalRecords} | Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount}
Overall Attendance Rate: ${attendanceRate !== null ? `${attendanceRate}%` : "No data"}

Generate a professional progress report in markdown using EXACTLY this structure:

## Executive Summary

(2–3 sentences giving a balanced overall picture of ${studentName}'s current academic standing. Reference the attendance rate and general performance trend.)

## Academic Performance

(Write one focused paragraph per subject. For each subject: state the performance level, reference specific scores/percentages, highlight what the student is doing well in that subject, and note any area of concern. Be specific and data-driven.)

## Attendance & Engagement

(Analyse the attendance pattern. Reference the ${attendanceRate !== null ? `${attendanceRate}% attendance rate` : "attendance data"} explicitly. Note any impact on academic performance if relevant. Be encouraging if attendance is good; be constructive and solution-focused if it needs improvement.)

## Strengths & Achievements

(Bullet list of 3–5 specific, evidence-backed strengths. Each bullet should reference actual data or observable behaviours.)

## Areas for Development

(Bullet list of 2–4 specific, actionable areas needing improvement. Frame these constructively — focus on opportunity, not failure.)

## Recommendations for Parents

(Numbered list of 4–5 practical, specific actions the parent can take at home to support their child's progress.)

---

*This report was prepared based on available academic records. For a detailed discussion, please contact the class teacher.*

Tone requirements: warm but professional, specific not generic, encouraging but honest. Address the parent directly using "your child" or "${studentName}".`;

    const report = await generateText(prompt);

    return NextResponse.json({
      report,
      studentName,
      studentInfo: { class: s.class, section: s.section },
      chartData: {
        coursePerformance: coursePerformanceData,
        attendance: attendanceChartData,
        summary: {
          attendanceRate,
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          totalCourses: coursePerformanceData.length,
          bestCourse: bestCourse?.courseName ?? null,
          bestCoursePct: bestCourse?.pct ?? null,
        },
      },
    });
  } catch (err) {
    console.error("AI parent report error:", err);
    return NextResponse.json({ error: "Failed to generate report. Please try again." }, { status: 500 });
  }
}
