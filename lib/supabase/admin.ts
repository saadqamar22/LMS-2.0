import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || supabaseUrl === "your_supabase_project_url") {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Please set it in your environment.",
    );
  }

  if (!serviceRoleKey || serviceRoleKey === "your_service_role_key") {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your environment (server-only).",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

