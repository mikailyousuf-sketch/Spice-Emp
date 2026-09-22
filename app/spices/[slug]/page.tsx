import Link from "next/link";
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
      id,name,slug,description,short_description,heat_level,country_of_origin,jar_render_path,hero_render_path,
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
  const jarRenderUrl = getProductImageUrl(product.jar_render_path ?? null);
  const heroRenderUrl = getProductImageUrl(product.hero_render_path ?? null);
  const primaryVisual = heroRenderUrl || jarRenderUrl || primaryImageUrl;
  const premiumVisual = Boolean(heroRenderUrl || jarRenderUrl);

  const relationNames = (value: Array<{ name: string }> | null | undefined) =>
    (value ?? []).map((item) => item.name);

  const tags = Array.from(new Set([
    ...(product.product_cuisines ?? []).flatMap((item) => relationNames(item.cuisines)),
    ...(product.product_food_types ?? []).flatMap((item) => relationNames(item.food_types)),
    ...(product.product_flavours ?? []).flatMap((item) => relationNames(item.flavours)),
    ...(product.product_cooking_methods ?? []).flatMap((item) => relationNames(item.cooking_methods)),
  ]));

  const variants = (product.product_variants ?? [])
    .filter((variant) => variant.is_active)
    .sort((a, b) => Number(a.weight_value) - Number(b.weight_value));

  const cheapest = variants
    .filter((variant) => Number(variant.stock_quantity) > 0)
    .sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0];

  return (
    <main className="pantry-product-page">
      <section className="section-wrap pantry-product-shell">
        <nav className="pantry-breadcrumb" aria-label="Breadcrumb">
          <Link href="/shop">The pantry</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="pantry-product-layout">
          <div className="pantry-product-media">
            <div className="pantry-product-visual">
              <span className="pantry-product-visual-label">The Glided Pantry</span>
              {primaryVisual ? (
                <img
                  src={primaryVisual}
                  alt={primaryImage?.alt_text || product.name}
                  className={premiumVisual ? "pantry-product-render" : "pantry-product-photo"}
                />
              ) : (
                <div className="pantry-product-placeholder">
                  <img src="/branding/glided-monogram.svg" alt="" />
                </div>
              )}
              <div className="pantry-product-plinth" aria-hidden="true" />
            </div>

            {images.length > 1 ? (
              <div className="pantry-product-thumbs">
                {images.slice(0, 5).map((image) => {
                  const url = getProductImageUrl(image.storage_path);
                  return url ? (
                    <img
                      key={image.id}
                      src={url}
                      alt={image.alt_text || product.name}
                    />
                  ) : null;
                })}
              </div>
            ) : null}
          </div>

          <div className="pantry-product-info">
            <p className="pantry-kicker">Spice catalogue</p>
            <h1>{product.name}</h1>

            {cheapest ? (
              <p className="pantry-product-from">
                From <strong>R{(cheapest.retail_price_cents / 100).toFixed(2)}</strong>
              </p>
            ) : null}

            <p className="pantry-product-description">
              {product.description || product.short_description || "A pantry staple selected for versatile everyday cooking."}
            </p>

            <div className="pantry-product-facts">
              <div>
                <span>Heat</span>
                <div className="pantry-heat-dots" aria-label={`Heat level ${product.heat_level} out of 5`}>
                  {[1,2,3,4,5].map(level => (
                    <i key={level} className={level <= product.heat_level ? "is-active" : ""} />
                  ))}
                </div>
              </div>
              <div>
                <span>Origin</span>
                <strong>{product.country_of_origin || "Not specified"}</strong>
              </div>
            </div>

            {tags.length ? (
              <div className="pantry-product-tags">
                {tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            ) : null}

            {error ? (
              <p className="pantry-product-error">{error}</p>
            ) : null}

            <div className="pantry-variant-section">
              <div className="pantry-variant-heading">
                <div>
                  <span>Choose your jar</span>
                  <p>Select a size and add it to your pantry.</p>
                </div>
                <span>{variants.length} size{variants.length === 1 ? "" : "s"}</span>
              </div>

              <div className="pantry-variant-list">
                {variants.map((variant) => {
                  const inStock = Number(variant.stock_quantity) > 0;

                  return (
                    <article key={variant.id} className={`pantry-variant ${inStock ? "" : "is-sold-out"}`}>
                      <div className="pantry-variant-main">
                        <div>
                          <h2>{variant.weight_value}{variant.weight_unit}</h2>
                          <p>{inStock ? "Available" : "Out of stock"} · SKU {variant.sku}</p>
                        </div>
                        <strong>R{(variant.retail_price_cents / 100).toFixed(2)}</strong>
                      </div>

                      <form action={addToCart} className="pantry-variant-actions">
                        <input type="hidden" name="variantId" value={variant.id} />
                        <label>
                          <span>Qty</span>
                          <input
                            name="quantity"
                            type="number"
                            min="1"
                            max={variant.stock_quantity}
                            defaultValue="1"
                            disabled={!inStock}
                          />
                        </label>
                        <button type="submit" disabled={!inStock}>
                          {inStock ? "Add to cart +" : "Sold out"}
                        </button>
                      </form>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="pantry-product-service">
              <div>
                <span>01</span>
                <strong>Selected for the pantry</strong>
                <p>Clear sizing, stock and pricing from the live catalogue.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Built for everyday cooking</strong>
                <p>Use the tags above to explore the dishes, flavours and methods it suits.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Need more?</strong>
                <p>Business and bulk ordering are available through our wholesale flow.</p>
              </div>
            </div>

            <div className="pantry-product-notes">
              <p>Delivery options are calculated at checkout.</p>
              <Link href="/business">Need larger quantities? Visit wholesale →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
