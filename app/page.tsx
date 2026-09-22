import Link from "next/link";
import { ComingSoonJar } from "@/components/products/coming-soon-jar";
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
            <p className="pantry-kicker">Premium spices</p>
            <h1>A more flavourful pantry.</h1>
            <p className="pantry-subline">
              Simple ingredients <b>·</b> Brighter meals <b>·</b> A more beautiful everyday
            </p>
            <span className="pantry-gold-dash" />
          </div>

          <div className="pantry-display">
            <div className="pantry-jar-grid">
              {comingSoonSpices.map((spice) => (
                <article className="pantry-display-item" key={spice.name}>
                  <div className="pantry-jar-zone">
                    <ComingSoonJar name={spice.name} image={spice.image} className="pantry-home-jar" />
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
                <strong>Pure ingredients</strong>
                <p>Nothing artificial. Ever.</p>
              </div>
            </div>
            <div className="pantry-benefit">
              <span className="pantry-benefit-icon">◇</span>
              <div>
                <strong>Premium quality</strong>
                <p>Spices that inspire.</p>
              </div>
            </div>
            <div className="pantry-benefit">
              <span className="pantry-benefit-icon">♡</span>
              <div>
                <strong>A brighter everyday</strong>
                <p>More flavour. A better table.</p>
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
