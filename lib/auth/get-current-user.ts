import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "./get-session";

interface CurrentUserProfile {
  id: string;
  role: string;
  email: string;
  fullName: string;
}

export async function getCurrentUser(): Promise<CurrentUserProfile | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", session.userId)
    .maybeSingle();

  const fullNameFromDb = data?.full_name;

  return {
    id: session.userId,
    role: session.role,
    email: session.email,
    fullName: fullNameFromDb?.trim() || session.fullName || "Guest",
  };
}

