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
          section: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          registration_number?: string | null;
          class?: string | null;
          parent_id?: string | null;
          section?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          registration_number?: string | null;
          class?: string | null;
          parent_id?: string | null;
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
    };
  };
}

