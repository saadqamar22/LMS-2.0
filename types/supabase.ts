export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          password: string;
          email: string;
          created_at: string | null;
          role: "student" | "teacher" | "parent" | "admin";
          full_name: string | null;
        };
        Insert: {
          id?: string;
          password: string;
          email: string;
          created_at?: string;
          role?: "student" | "teacher" | "parent" | "admin";
          full_name?: string | null;
        };
        Update: {
          id?: string;
          password?: string;
          email?: string;
          created_at?: string;
          role?: "student" | "teacher" | "parent" | "admin";
          full_name?: string | null;
        };
      };
      teachers: {
        Row: {
          id: string;
          employee_id: string;
          department: string;
          designation: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          employee_id: string;
          department: string;
          designation: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          department?: string;
          designation?: string;
          created_at?: string | null;
        };
      };
      parents: {
        Row: {
          id: string;
          phone_number: string;
          address: string;
          full_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          phone_number: string;
          address: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          address?: string;
          full_name?: string | null;
          created_at?: string | null;
        };
      };
      courses: {
        Row: {
          course_id: string;
          course_name: string;
          course_code: string;
          teacher_id: string | null;
          created_at: string | null;
        };
        Insert: {
          course_id?: string;
          course_name: string;
          course_code: string;
          teacher_id?: string | null;
          created_at?: string;
        };
        Update: {
          course_id?: string;
          course_name?: string;
          course_code?: string;
          teacher_id?: string | null;
          created_at?: string | null;
        };
      };
      modules: {
        Row: {
          module_id: string;
          course_id: string;
          module_name: string;
          total_marks: number;
          created_at: string | null;
        };
        Insert: {
          module_id?: string;
          course_id: string;
          module_name: string;
          total_marks: number;
          created_at?: string;
        };
        Update: {
          module_id?: string;
          course_id?: string;
          module_name?: string;
          total_marks?: number;
          created_at?: string | null;
        };
      };
      enrollments: {
        Row: {
          enrollment_id: string;
          student_id: string;
          course_id: string;
        };
        Insert: {
          enrollment_id?: string;
          student_id: string;
          course_id: string;
        };
        Update: {
          enrollment_id?: string;
          student_id?: string;
          course_id?: string;
        };
      };
      students: {
        Row: {
          id: string;
          registration_number: string | null;
          class: string | null;
          parent_id: string | null;
          parent_key: string | null;
          section: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          registration_number?: string | null;
          class?: string | null;
          parent_id?: string | null;
          parent_key?: string | null;
          section?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          registration_number?: string | null;
          class?: string | null;
          parent_id?: string | null;
          parent_key?: string | null;
          section?: string | null;
          created_at?: string | null;
        };
      };
      attendance: {
        Row: {
          attendance_id: string;
          course_id: string;
          student_id: string;
          date: string;
          status: "present" | "absent" | "late";
        };
        Insert: {
          attendance_id?: string;
          course_id: string;
          student_id: string;
          date: string;
          status: "present" | "absent" | "late";
        };
        Update: {
          attendance_id?: string;
          course_id?: string;
          student_id?: string;
          date?: string;
          status?: "present" | "absent" | "late";
        };
      };
      marks: {
        Row: {
          mark_id: string;
          student_id: string;
          module_id: string;
          obtained_marks: number;
          average: number | null;
          std_deviation: number | null;
          min_marks: number | null;
          max_marks: number | null;
          median_marks: number | null;
          created_at: string | null;
        };
        Insert: {
          mark_id?: string;
          student_id: string;
          module_id: string;
          obtained_marks: number;
          average?: number | null;
          std_deviation?: number | null;
          min_marks?: number | null;
          max_marks?: number | null;
          median_marks?: number | null;
          created_at?: string | null;
        };
        Update: {
          mark_id?: string;
          student_id?: string;
          module_id?: string;
          obtained_marks?: number;
          average?: number | null;
          std_deviation?: number | null;
          min_marks?: number | null;
          max_marks?: number | null;
          median_marks?: number | null;
          created_at?: string | null;
        };
      };
      assignments: {
        Row: {
          assignment_id: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          deadline: string;
          file_url: string | null;
          created_at: string | null;
        };
        Insert: {
          assignment_id?: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description?: string | null;
          deadline: string;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          assignment_id?: string;
          course_id?: string;
          teacher_id?: string;
          title?: string;
          description?: string | null;
          deadline?: string;
          file_url?: string | null;
          created_at?: string | null;
        };
      };
      submissions: {
        Row: {
          submission_id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          text_answer: string | null;
          marks: number | null;
          feedback: string | null;
          submitted_at: string | null;
          graded_at: string | null;
        };
        Insert: {
          submission_id?: string;
          assignment_id: string;
          student_id: string;
          file_url?: string | null;
          text_answer?: string | null;
          marks?: number | null;
          feedback?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
        };
        Update: {
          submission_id?: string;
          assignment_id?: string;
          student_id?: string;
          file_url?: string | null;
          text_answer?: string | null;
          marks?: number | null;
          feedback?: string | null;
          submitted_at?: string | null;
          graded_at?: string | null;
        };
      };
      announcements: {
        Row: {
          announcement_id: string;
          teacher_id: string;
          course_id: string | null;
          title: string;
          content: string;
          audience: "students" | "parents" | "both";
          created_at: string | null;
        };
        Insert: {
          announcement_id?: string;
          teacher_id: string;
          course_id?: string | null;
          title: string;
          content: string;
          audience: "students" | "parents" | "both";
          created_at?: string;
        };
        Update: {
          announcement_id?: string;
          teacher_id?: string;
          course_id?: string | null;
          title?: string;
          content?: string;
          audience?: "students" | "parents" | "both";
          created_at?: string | null;
        };
      };
      materials: {
        Row: {
          material_id: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          type: "pdf" | "video" | "link" | "image" | "other";
          file_url: string | null;
          external_url: string | null;
          created_at: string | null;
        };
        Insert: {
          material_id?: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description?: string | null;
          type: "pdf" | "video" | "link" | "image" | "other";
          file_url?: string | null;
          external_url?: string | null;
          created_at?: string;
        };
        Update: {
          material_id?: string;
          course_id?: string;
          teacher_id?: string;
          title?: string;
          description?: string | null;
          type?: "pdf" | "video" | "link" | "image" | "other";
          file_url?: string | null;
          external_url?: string | null;
          created_at?: string | null;
        };
      };
      quizzes: {
        Row: {
          quiz_id: string;
          course_id: string;
          teacher_id: string;
          module_id: string | null;
          title: string;
          description: string | null;
          total_marks: number;
          time_limit_mins: number | null;
          is_published: boolean;
          created_at: string | null;
        };
        Insert: {
          quiz_id?: string;
          course_id: string;
          teacher_id: string;
          module_id?: string | null;
          title: string;
          description?: string | null;
          total_marks: number;
          time_limit_mins?: number | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          quiz_id?: string;
          course_id?: string;
          teacher_id?: string;
          module_id?: string | null;
          title?: string;
          description?: string | null;
          total_marks?: number;
          time_limit_mins?: number | null;
          is_published?: boolean;
          created_at?: string | null;
        };
      };
      questions: {
        Row: {
          question_id: string;
          quiz_id: string;
          question_text: string;
          type: "mcq" | "true_false" | "short_answer";
          options: string[] | null;
          correct_answer: string;
          marks: number;
          order_index: number;
          created_at: string | null;
        };
        Insert: {
          question_id?: string;
          quiz_id: string;
          question_text: string;
          type: "mcq" | "true_false" | "short_answer";
          options?: string[] | null;
          correct_answer: string;
          marks: number;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          question_id?: string;
          quiz_id?: string;
          question_text?: string;
          type?: "mcq" | "true_false" | "short_answer";
          options?: string[] | null;
          correct_answer?: string;
          marks?: number;
          order_index?: number;
          created_at?: string | null;
        };
      };
      quiz_attempts: {
        Row: {
          attempt_id: string;
          quiz_id: string;
          student_id: string;
          answers: Record<string, string> | null;
          score: number | null;
          started_at: string | null;
          submitted_at: string | null;
        };
        Insert: {
          attempt_id?: string;
          quiz_id: string;
          student_id: string;
          answers?: Record<string, string> | null;
          score?: number | null;
          started_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          attempt_id?: string;
          quiz_id?: string;
          student_id?: string;
          answers?: Record<string, string> | null;
          score?: number | null;
          started_at?: string | null;
          submitted_at?: string | null;
        };
      };
      notifications: {
        Row: {
          notification_id: string;
          user_id: string;
          title: string;
          message: string;
          type: "assignment_graded" | "new_assignment" | "quiz_published" | "mark_posted" | "announcement" | "system";
          reference_id: string | null;
          reference_type: string | null;
          is_read: boolean;
          created_at: string | null;
        };
        Insert: {
          notification_id?: string;
          user_id: string;
          title: string;
          message: string;
          type: "assignment_graded" | "new_assignment" | "quiz_published" | "mark_posted" | "announcement" | "system";
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          notification_id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: "assignment_graded" | "new_assignment" | "quiz_published" | "mark_posted" | "announcement" | "system";
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          created_at?: string | null;
        };
      };
    };
  };
}

