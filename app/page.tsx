import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { comingSoonSpices } from "@/lib/coming-soon";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: latestProducts } = await supabase
    .from("products")
    .select(`
      id,name,slug,short_description,heat_level,jar_render_path,hero_render_path,
      product_variants(id,weight_value,weight_unit,retail_price_cents,stock_quantity),
      product_images(id,storage_path,alt_text,is_primary,sort_order)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

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
              Global spice <b>·</b> Better cooking <b>·</b> Beautifully simple
            </p>
            <span className="pantry-gold-dash" />
            <div className="pantry-hero-actions">
              <Link href="/shop" className="pantry-hero-primary">Explore the pantry</Link>
              <Link href="/business" className="pantry-hero-secondary">For business</Link>
            </div>
          </div>

          <div className="pantry-display">
            <div className="pantry-jar-grid">
              {comingSoonSpices.map((spice) => (
                <article className="pantry-display-item" key={spice.name}>
                  <div className="pantry-jar-zone">
                    <img
                      src={spice.image}
                      alt={spice.name}
                      className="pantry-display-jar"
                    />
                  </div>
                  <div className="pantry-product-copy">
                    <h2>{spice.name}</h2>
                    <span>Coming soon</span>
                  </div>
                </article>
              ))}
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
