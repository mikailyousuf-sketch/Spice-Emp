import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

export async function requireUser() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");
  return userId;
}

export async function requireAdmin() {
  const userId = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"])
    .limit(1);

  if (error || !data?.length) redirect("/");
  return userId;
}
