import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity,low_stock_threshold,products(id,name,slug,is_active)")
    .order("stock_quantity", { ascending: true });

  return (
    <section>
      <span className="eyebrow">Operations</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Inventory</h1>
      <p className="mt-4 max-w-2xl text-stone-400">
        Current stock across all sellable product variants.
      </p>

      {error ? (
        <p className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
          {error.message}
        </p>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/10 bg-white/[.035] px-5 py-3 text-xs uppercase tracking-[.12em] text-stone-500 md:grid">
          <span>Product</span>
          <span>SKU / size</span>
          <span>Stock</span>
          <span>Price</span>
          <span />
        </div>

        <div className="divide-y divide-white/10">
          {variants?.map((variant) => {
            const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
            const isLow = Number(variant.stock_quantity) <= Number(variant.low_stock_threshold);

            return (
              <div
                key={variant.id}
                className="grid gap-3 bg-white/[.02] px-5 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="font-semibold">{product?.name ?? "Unknown product"}</p>
                  <p className="mt-1 text-xs text-stone-600">{product?.is_active ? "Active" : "Draft"}</p>
                </div>
                <div className="text-sm text-stone-400">
                  <p>{variant.sku}</p>
                  <p className="mt-1 text-xs text-stone-600">{variant.weight_value}{variant.weight_unit}</p>
                </div>
                <div>
                  <p className={isLow ? "font-semibold text-red-300" : "font-semibold text-stone-200"}>
                    {variant.stock_quantity}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Low at {variant.low_stock_threshold}
                  </p>
                </div>
                <p className="font-semibold text-orange-100">
                  R{(variant.retail_price_cents / 100).toFixed(2)}
                </p>
                {product?.id ? (
                  <Link href={`/admin/products/${product.id}`} className="text-sm text-orange-200 hover:text-orange-100">
                    Edit
                  </Link>
                ) : null}
              </div>
            );
          })}

          {!variants?.length ? (
            <div className="p-8 text-center text-stone-500">No inventory records yet.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
