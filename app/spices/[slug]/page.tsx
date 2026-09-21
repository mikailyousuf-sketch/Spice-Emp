import { notFound } from "next/navigation";
import { addToCart } from "@/app/cart/actions";
import { getProductImageUrl } from "@/lib/products/image-url";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function SpicePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,name,slug,description,short_description,heat_level,country_of_origin,
      product_variants(id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity,is_active),
      product_images(id,storage_path,alt_text,is_primary,sort_order),
      product_cuisines(cuisines(name)),
      product_food_types(food_types(name)),
      product_flavours(flavours(name)),
      product_cooking_methods(cooking_methods(name))
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) notFound();

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const primaryImage = images[0];
  const primaryImageUrl = getProductImageUrl(primaryImage?.storage_path);

  const relationNames = (value: Array<{ name: string }> | null | undefined) =>
    (value ?? []).map((item) => item.name);

  const tags = [
    ...(product.product_cuisines ?? []).flatMap((item) => relationNames(item.cuisines)),
    ...(product.product_food_types ?? []).flatMap((item) => relationNames(item.food_types)),
    ...(product.product_flavours ?? []).flatMap((item) => relationNames(item.flavours)),
    ...(product.product_cooking_methods ?? []).flatMap((item) => relationNames(item.cooking_methods)),
  ];

  const variants = (product.product_variants ?? []).filter((variant) => variant.is_active);

  return (
    <main className="pt-32">
      <section className="section-wrap grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <div className="glass-soft aspect-square overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_35%,rgba(255,186,73,.14),transparent_42%),rgba(0,0,0,.2)]">
            {primaryImageUrl ? (
              <img
                src={primaryImageUrl}
                alt={primaryImage?.alt_text || product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((image) => {
                const url = getProductImageUrl(image.storage_path);
                return url ? (
                  <img
                    key={image.id}
                    src={url}
                    alt={image.alt_text || product.name}
                    className="aspect-square rounded-2xl border border-white/10 object-cover"
                  />
                ) : null;
              })}
            </div>
          ) : null}
        </div>

        <div className="lg:py-8">
          <span className="eyebrow">Spice catalogue</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">{product.name}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-400">{product.description || product.short_description}</p>
          <p className="mt-5 text-sm text-stone-500">
            Heat level {product.heat_level}/5{product.country_of_origin ? ` · Origin: ${product.country_of_origin}` : ""}
          </p>

          {tags.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-stone-400">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <div className="mt-8 grid gap-3">
            {variants.map((variant) => {
              const inStock = Number(variant.stock_quantity) > 0;

              return (
                <div key={variant.id} className="glass-soft rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{variant.weight_value}{variant.weight_unit}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        SKU {variant.sku} · {inStock ? `${variant.stock_quantity} in stock` : "Out of stock"}
                      </p>
                    </div>
                    <p className="font-semibold text-orange-100">R{(variant.retail_price_cents / 100).toFixed(2)}</p>
                  </div>

                  <form action={addToCart} className="mt-4 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="variantId" value={variant.id} />
                    <label className="grid gap-2 text-xs text-stone-500">
                      Quantity
                      <input
                        name="quantity"
                        type="number"
                        min="1"
                        max={variant.stock_quantity}
                        defaultValue="1"
                        disabled={!inStock}
                        className="field !w-24"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!inStock}
                      className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {inStock ? "Add to cart" : "Out of stock"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
