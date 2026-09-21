import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,slug,is_active,heat_level,product_variants(id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity)")
    .order("created_at", { ascending: false });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Products</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary">Add product</Link>
      </div>

      {error ? <p className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error.message}</p> : null}

      <div className="mt-8 grid gap-3">
        {products?.length ? products.map((product) => (
          <article key={product.id} className="glass-soft rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="display-font text-xl font-semibold">{product.name}</p>
                <p className="mt-1 text-xs text-stone-500">/{product.slug} · heat {product.heat_level}/5 · {product.is_active ? "active" : "draft"}</p>
              </div>
              <p className="text-sm text-stone-400">{product.product_variants?.length ?? 0} variant(s)</p>
            </div>
          </article>
        )) : <div className="glass-soft rounded-2xl p-8 text-stone-400">No products yet.</div>}
      </div>
    </section>
  );
}
