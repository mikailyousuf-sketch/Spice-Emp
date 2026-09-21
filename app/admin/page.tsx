import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ count: products }, { count: variants }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("product_variants").select("*", { count: "exact", head: true }),
  ]);

  return (
    <section>
      <span className="eyebrow">Admin</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="glass-soft rounded-[2rem] p-6">
          <p className="text-sm text-stone-500">Products</p>
          <p className="display-font mt-2 text-4xl font-semibold">{products ?? 0}</p>
        </div>
        <div className="glass-soft rounded-[2rem] p-6">
          <p className="text-sm text-stone-500">Variants</p>
          <p className="display-font mt-2 text-4xl font-semibold">{variants ?? 0}</p>
        </div>
      </div>

      <Link href="/admin/products/new" className="btn-primary mt-8">Create product</Link>
    </section>
  );
}
