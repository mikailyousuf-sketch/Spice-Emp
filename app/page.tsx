import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { getProductImageUrl } from "@/lib/products/image-url";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const productSelect = `
    id,name,slug,short_description,heat_level,jar_render_path,hero_render_path,
    product_variants(id,weight_value,weight_unit,retail_price_cents,stock_quantity),
    product_images(id,storage_path,alt_text,is_primary,sort_order)
  `;

  const [{ data: featuredProducts }, { data: latestProducts }] = await Promise.all([
    supabase
      .from("products")
      .select(productSelect)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("products")
      .select(productSelect)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const featuredSlots = Array.from({ length: 4 }, (_, index) => featuredProducts?.[index] ?? null);

  return (
    <main className="pantry-home">
      <section className="pantry-stage">
        <div className="pantry-stage-inner">
          <aside className="pantry-side-note pantry-side-note-left" aria-hidden="true">
            <span>Simple</span>
            <span>ingredients</span>
            <span>extraordinary</span>
            <span>moments</span>
            <i />
          </aside>

          <aside className="pantry-side-note pantry-side-note-right" aria-hidden="true">
            <span>Spices</span>
            <span>elevate</span>
            <span>everyday</span>
            <i />
          </aside>

          <div className="pantry-hero-copy">
            <p className="pantry-kicker">The Glided Pantry · South Africa</p>
            <h1>A more flavourful pantry.</h1>
            <p className="pantry-subline">
              Spices from around the world <b>·</b> Made easier to discover
            </p>
            <span className="pantry-gold-dash" />
            <div className="pantry-hero-actions">
              <Link href="/shop" className="pantry-hero-primary">[Explore The Pantry]    </Link>
              <Link href="/business" className="pantry-hero-secondary">     [For business]</Link>
            </div>
          </div>

          <div className="pantry-display">
            <div className="pantry-jar-grid">
              {featuredSlots.map((product, index) => {
                if (!product) {
                  return (
                    <div className="pantry-display-item pantry-featured-empty" key={`featured-empty-${index}`}>
                      <div className="pantry-jar-zone">
                        <div className="pantry-empty-visual" aria-hidden="true">
                          <img src="/branding/glided-monogram.svg" alt="" />
                        </div>
                      </div>
                    </div>
                  );
                }

                const images = [...(product.product_images ?? [])].sort(
                  (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
                );
                const image = images[0];
                const imageUrl = getProductImageUrl(image?.storage_path)
                  || getProductImageUrl(product.jar_render_path ?? null);
                const cheapest = [...(product.product_variants ?? [])]
                  .filter((variant) => variant.stock_quantity > 0)
                  .sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0];

                return (
                  <article className="pantry-display-item" key={product.id}>
                    <Link href={`/spices/${product.slug}`} className="block">
                      <div className="pantry-jar-zone">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={image?.alt_text || product.name}
                            className="pantry-display-jar pantry-featured-photo"
                          />
                        ) : (
                          <div className="pantry-empty-visual">
                            <img src="/branding/glided-monogram.svg" alt="" />
                          </div>
                        )}
                      </div>
                      <div className="pantry-product-copy">
                        <h2>{product.name}</h2>
                        <span>{cheapest ? `From R${(cheapest.retail_price_cents / 100).toFixed(2)}` : "View product"}</span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>

            <div className="pantry-glass-shelf" aria-hidden="true">
              <div className="pantry-shelf-glass" />
              <div className="pantry-shelf-chrome" />
              <div className="pantry-shelf-shadow" />
            </div>
          </div>

          <div className="pantry-benefits">
            <div className="pantry-benefit">
              <span className="pantry-benefit-icon">◌</span>
              <div>
                <strong>Curated pantry</strong>
                <p>A growing collection for everyday cooking.</p>
              </div>
            </div>
            <div className="pantry-benefit">
              <span className="pantry-benefit-icon">◇</span>
              <div>
                <strong>Cook by flavour</strong>
                <p>Discover by dish, cuisine, heat and method.</p>
              </div>
            </div>
            <div className="pantry-benefit">
              <span className="pantry-benefit-icon">↗</span>
              <div>
                <strong>Retail + wholesale</strong>
                <p>From home kitchens to busy food businesses.</p>
              </div>
            </div>
          </div>

          <div className="pantry-stage-footer">
            <span />
            <p>Good food lives here</p>
            <span />
          </div>

          <Link href="/shop#pantry-search" className="pantry-scroll-cue">
            <span>Explore</span>
            <i>↓</i>
          </Link>
        </div>
      </section>

      {latestProducts?.length ? (
        <section className="pantry-real-products">
          <div className="section-wrap">
            <div className="pantry-section-head">
              <div>
                <p className="pantry-kicker">The pantry</p>
                <h2>Ready when you are.</h2>
              </div>
              <Link href="/shop" className="pantry-text-link">View all spices →</Link>
            </div>

            <div className="mt-8 grid gap-x-4 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
