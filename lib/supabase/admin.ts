import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getSupabaseUrl } from "./env";

export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

