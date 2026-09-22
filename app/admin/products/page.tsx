import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,slug,is_active,is_featured,heat_level,product_variants(id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity)")
    .order("is_featured", { ascending: false })
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

      <div id="featured-items" className="admin-featured-note mt-8 scroll-mt-36">
        <div>
          <span>Homepage shelf</span>
          <strong>Featured items</strong>
          <p>Mark up to four products as Featured. Their primary uploaded images appear on the homepage shelf.</p>
        </div>
        <Link href="/" className="btn-secondary">View homepage</Link>
      </div>

      <div className="mt-8 grid gap-3">
        {products?.length ? products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="glass-soft rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-orange-200/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="display-font text-xl font-semibold">{product.name}</p>
                  {product.is_featured ? <span className="admin-featured-badge">Featured</span> : null}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  /{product.slug} · heat {product.heat_level}/5 · {product.is_active ? "active" : "draft"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-400">{product.product_variants?.length ?? 0} variant(s)</p>
                <p className="mt-1 text-xs text-orange-200/70">Edit →</p>
              </div>
            </div>
          </Link>
        )) : <div className="glass-soft rounded-2xl p-8 text-stone-400">No products yet.</div>}
      </div>
    </section>
  );
}
