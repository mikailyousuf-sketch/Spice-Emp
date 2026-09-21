import { ProductCard } from "@/components/products/product-card";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export const metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: Props) {
  const { q, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id,name,slug,short_description,heat_level,product_type_id,product_variants(id,weight_value,weight_unit,retail_price_cents,stock_quantity)")
    .eq("is_active", true)
    .order("name");

  if (q?.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  if (type) {
    query = query.eq("product_type_id", type);
  }

  const [{ data: products, error }, { data: types }] = await Promise.all([
    query,
    supabase.from("product_types").select("id,name").order("name"),
  ]);

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Catalogue</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">Shop spices</h1>

        <form className="glass-soft mt-8 grid gap-3 rounded-[2rem] p-4 md:grid-cols-[1fr_240px_auto]">
          <input name="q" defaultValue={q} placeholder="Search spices..." className="field" />
          <select name="type" defaultValue={type ?? ""} className="field">
            <option value="">All product types</option>
            {types?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="btn-primary" type="submit">Search</button>
        </form>

        {error ? (
          <p className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
            Catalogue could not load: {error.message}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {!error && !products?.length ? (
          <div className="glass-soft mt-8 rounded-[2rem] p-10 text-center text-stone-400">
            No catalogue products match this view yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}
