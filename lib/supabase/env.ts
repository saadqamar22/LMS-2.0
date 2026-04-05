const PLACEHOLDER_URL = "your_supabase_project_url";
const PLACEHOLDER_ANON = "your_supabase_anon_key";

export function getSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === PLACEHOLDER_URL) {
    throw new Error(
      "Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file. Get your URL from https://app.supabase.com/project/_/settings/api",
    );
  }
  if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
    throw new Error(
      `Invalid Supabase URL: "${supabaseUrl}". Must be a valid HTTP or HTTPS URL.`,
    );
  }
  return supabaseUrl;
}

/**
 * Public client key: legacy anon JWT or newer dashboard "publishable" key.
 */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!key || key === PLACEHOLDER_ANON) {
    throw new Error(
      "Missing Supabase client key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local (API keys in Supabase project settings).",
    );
  }
  return key;
}
