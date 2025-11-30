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
          full_name: string | null;
          email: string;
          role: "student" | "teacher" | "parent" | "admin";
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email: string;
          role?: "student" | "teacher" | "parent" | "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          role?: "student" | "teacher" | "parent" | "admin";
          created_at?: string;
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
          section: string | null;
          parent_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          registration_number?: string | null;
          class?: string | null;
          section?: string | null;
          parent_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          registration_number?: string | null;
          class?: string | null;
          section?: string | null;
          parent_id?: string | null;
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
    };
  };
}

