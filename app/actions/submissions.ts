"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/get-session";
import { revalidatePath } from "next/cache";

export interface Submission {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  text_answer: string | null;
  marks: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  student_name?: string;
  registration_number?: string | null;
}

export interface CreateSubmissionInput {
  assignmentId: string;
  textAnswer?: string;
  fileUrl?: string;
}

export interface GradeSubmissionInput {
  submissionId: string;
  marks: number;
  feedback?: string;
}

/**
 * Submit an assignment (student only)
 */
export async function submitAssignment(
  input: CreateSubmissionInput,
): Promise<
  | { success: true; submission: Submission }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can submit assignments.",
    };
  }

  if (!input.textAnswer?.trim() && !input.fileUrl?.trim()) {
    return {
      success: false,
      error: "Please provide either a text answer or upload a file.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify assignment exists and student is enrolled
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("assignment_id, course_id")
      .eq("assignment_id", input.assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        success: false,
        error: "Assignment not found.",
      };
    }

    // Verify student is enrolled
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("course_id", assignment.course_id)
      .eq("student_id", session.userId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return {
        success: false,
        error: "You are not enrolled in this course.",
      };
    }

    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from("submissions")
      .select("submission_id")
      .eq("assignment_id", input.assignmentId)
      .eq("student_id", session.userId)
      .maybeSingle();

    let submission;
    if (existingSubmission) {
      // Update existing submission
      const { data: updated, error: updateError } = await supabase
        .from("submissions")
        .update({
          text_answer: input.textAnswer?.trim() || null,
          file_url: input.fileUrl?.trim() || null,
          submitted_at: new Date().toISOString(),
        })
        .eq("submission_id", existingSubmission.submission_id)
        .select()
        .single();

      if (updateError) {
        console.error(
          "Error updating submission:",
          JSON.stringify(updateError, null, 2),
        );
        return {
          success: false,
          error: updateError.message || "Failed to update submission.",
        };
      }
      submission = updated;
    } else {
      // Create new submission
      const { data: created, error: createError } = await supabase
        .from("submissions")
        .insert({
          assignment_id: input.assignmentId,
          student_id: session.userId,
          text_answer: input.textAnswer?.trim() || null,
          file_url: input.fileUrl?.trim() || null,
        })
        .select()
        .single();

      if (createError) {
        console.error(
          "Error creating submission:",
          JSON.stringify(createError, null, 2),
        );
        return {
          success: false,
          error: createError.message || "Failed to submit assignment.",
        };
      }
      submission = created;
    }

    revalidatePath(`/student/courses/${assignment.course_id}/assignments/${input.assignmentId}`);
    revalidatePath(`/teacher/courses/${assignment.course_id}/assignments/${input.assignmentId}`);

    return {
      success: true,
      submission: {
        submission_id: submission.submission_id,
        assignment_id: submission.assignment_id,
        student_id: submission.student_id,
        file_url: submission.file_url,
        text_answer: submission.text_answer,
        marks: submission.marks,
        feedback: submission.feedback,
        submitted_at: submission.submitted_at,
        graded_at: submission.graded_at,
      },
    };
  } catch (error) {
    console.error("Unexpected error submitting assignment:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get submissions for an assignment (teacher only)
 */
export async function getAssignmentSubmissions(
  assignmentId: string,
): Promise<
  | { success: true; submissions: Submission[] }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can view submissions.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify assignment exists and teacher owns the course
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("assignment_id, course_id, teacher_id")
      .eq("assignment_id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        success: false,
        error: "Assignment not found.",
      };
    }

    if (assignment.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to view submissions for this assignment.",
      };
    }

    // Fetch submissions with student info
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select(
        `
        submission_id,
        assignment_id,
        student_id,
        file_url,
        text_answer,
        marks,
        feedback,
        submitted_at,
        graded_at,
        students!submissions_student_id_fkey (
          id,
          registration_number,
          users!students_id_fkey (
            full_name
          )
        )
      `,
      )
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });

    if (submissionsError) {
      console.error(
        "Error fetching submissions:",
        JSON.stringify(submissionsError, null, 2),
      );
      return {
        success: false,
        error: submissionsError.message || "Failed to fetch submissions.",
      };
    }

    const submissionsList = (submissions || []).map((submission) => ({
      submission_id: submission.submission_id,
      assignment_id: submission.assignment_id,
      student_id: submission.student_id,
      file_url: submission.file_url,
      text_answer: submission.text_answer,
      marks: submission.marks,
      feedback: submission.feedback,
      submitted_at: submission.submitted_at,
      graded_at: submission.graded_at,
      student_name:
        (submission.students as {
          users: { full_name: string | null } | null;
        } | null)?.users?.full_name || "Unknown",
      registration_number:
        (submission.students as { registration_number: string | null } | null)
          ?.registration_number || null,
    }));

    return {
      success: true,
      submissions: submissionsList,
    };
  } catch (error) {
    console.error("Unexpected error fetching submissions:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get student's submission for an assignment
 */
export async function getStudentSubmission(
  assignmentId: string,
): Promise<
  | { success: true; submission: Submission | null }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "student") {
    return {
      success: false,
      error: "Only students can view their submissions.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify assignment exists and student is enrolled
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("assignment_id, course_id")
      .eq("assignment_id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        success: false,
        error: "Assignment not found.",
      };
    }

    // Verify student is enrolled
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("enrollment_id")
      .eq("course_id", assignment.course_id)
      .eq("student_id", session.userId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return {
        success: false,
        error: "You are not enrolled in this course.",
      };
    }

    // Fetch submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_id", session.userId)
      .maybeSingle();

    if (submissionError) {
      console.error(
        "Error fetching submission:",
        JSON.stringify(submissionError, null, 2),
      );
      return {
        success: false,
        error: submissionError.message || "Failed to fetch submission.",
      };
    }

    return {
      success: true,
      submission: submission
        ? {
            submission_id: submission.submission_id,
            assignment_id: submission.assignment_id,
            student_id: submission.student_id,
            file_url: submission.file_url,
            text_answer: submission.text_answer,
            marks: submission.marks,
            feedback: submission.feedback,
            submitted_at: submission.submitted_at,
            graded_at: submission.graded_at,
          }
        : null,
    };
  } catch (error) {
    console.error("Unexpected error fetching submission:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Grade a submission (teacher only)
 */
export async function gradeSubmission(
  input: GradeSubmissionInput,
): Promise<
  | { success: true; submission: Submission }
  | { success: false; error: string }
> {
  const session = await getCurrentSession();

  if (!session) {
    return { success: false, error: "You must be logged in." };
  }

  if (session.role !== "teacher") {
    return {
      success: false,
      error: "Only teachers can grade submissions.",
    };
  }

  if (input.marks < 0) {
    return {
      success: false,
      error: "Marks cannot be negative.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Verify submission exists and teacher owns the assignment
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(
        `
        submission_id,
        assignment_id,
        assignments!submissions_assignment_id_fkey (
          teacher_id
        )
      `,
      )
      .eq("submission_id", input.submissionId)
      .single();

    if (submissionError || !submission) {
      return {
        success: false,
        error: "Submission not found.",
      };
    }

    const assignment = submission.assignments as { teacher_id: string } | null;
    if (assignment?.teacher_id !== session.userId) {
      return {
        success: false,
        error: "You do not have permission to grade this submission.",
      };
    }

    // Update submission with grade
    const { data: updated, error: updateError } = await supabase
      .from("submissions")
      .update({
        marks: input.marks,
        feedback: input.feedback?.trim() || null,
        graded_at: new Date().toISOString(),
      })
      .eq("submission_id", input.submissionId)
      .select()
      .single();

    if (updateError) {
      console.error(
        "Error grading submission:",
        JSON.stringify(updateError, null, 2),
      );
      return {
        success: false,
        error: updateError.message || "Failed to grade submission.",
      };
    }

    revalidatePath(`/teacher/courses/${submission.assignment_id}/assignments/${submission.assignment_id}`);
    revalidatePath(`/student/courses/*/assignments/${submission.assignment_id}`);

    return {
      success: true,
      submission: {
        submission_id: updated.submission_id,
        assignment_id: updated.assignment_id,
        student_id: updated.student_id,
        file_url: updated.file_url,
        text_answer: updated.text_answer,
        marks: updated.marks,
        feedback: updated.feedback,
        submitted_at: updated.submitted_at,
        graded_at: updated.graded_at,
      },
    };
  } catch (error) {
    console.error("Unexpected error grading submission:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

