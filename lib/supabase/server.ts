import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === "your_supabase_project_url") {
    throw new Error(
      "Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file. Get your URL from https://app.supabase.com/project/_/settings/api"
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key") {
    throw new Error(
      "Missing Supabase Anon Key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. Get your key from https://app.supabase.com/project/_/settings/api"
    );
  }

  if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
    throw new Error(
      `Invalid Supabase URL: "${supabaseUrl}". Must be a valid HTTP or HTTPS URL.`
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

