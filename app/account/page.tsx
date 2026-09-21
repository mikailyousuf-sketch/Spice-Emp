import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const userId = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("first_name,last_name,phone,account_type").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const isAdmin = roles?.some(({ role }) => role === "admin" || role === "super_admin");

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Account</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">
          {profile?.first_name ? `Welcome, ${profile.first_name}` : "Your Spice Emp account"}
        </h1>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="glass-soft rounded-[2rem] p-6">
            <p className="text-sm text-stone-500">Account type</p>
            <p className="display-font mt-2 text-2xl font-semibold capitalize">{profile?.account_type ?? "retail"}</p>
          </div>
          <div className="glass-soft rounded-[2rem] p-6">
            <p className="text-sm text-stone-500">Orders</p>
            <p className="mt-2 text-stone-300">Order history arrives in Phase 2.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {isAdmin ? <Link href="/admin" className="btn-primary">Open admin</Link> : null}
          <form action="/auth/signout" method="post">
            <button className="btn-secondary" type="submit">Sign out</button>
          </form>
        </div>
      </section>
    </main>
  );
}
