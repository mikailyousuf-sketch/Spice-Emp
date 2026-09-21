import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SpicePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id,name,slug,description,short_description,heat_level,country_of_origin,product_variants(id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) notFound();

  return (
    <main className="pt-32">
      <section className="section-wrap grid gap-10 py-20 lg:grid-cols-2">
        <div className="glass-soft aspect-square rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_35%,rgba(255,186,73,.14),transparent_42%),rgba(0,0,0,.2)]" />

        <div className="lg:py-8">
          <span className="eyebrow">Spice catalogue</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">{product.name}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-400">{product.description || product.short_description}</p>
          <p className="mt-5 text-sm text-stone-500">
            Heat level {product.heat_level}/5{product.country_of_origin ? ` · Origin: ${product.country_of_origin}` : ""}
          </p>

          <div className="mt-8 grid gap-3">
            {product.product_variants?.map((variant) => (
              <div key={variant.id} className="glass-soft flex items-center justify-between rounded-2xl p-4">
                <div>
                  <p className="font-semibold">{variant.weight_value}{variant.weight_unit}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    SKU {variant.sku} · {variant.stock_quantity > 0 ? "In stock" : "Out of stock"}
                  </p>
                </div>
                <p className="font-semibold text-orange-100">R{(variant.retail_price_cents / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
