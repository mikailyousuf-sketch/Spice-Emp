import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { createClient } from "@/lib/supabase/server";

const discovery = [
  ["01", "By cuisine", "🌍"],
  ["02", "By dish", "🍛"],
  ["03", "By flavour", "✨"],
  ["04", "By heat", "🌶"],
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: latestProducts } = await supabase
    .from("products")
    .select(`
      id,name,slug,short_description,heat_level,
      product_variants(id,weight_value,weight_unit,retail_price_cents,stock_quantity),
      product_images(id,storage_path,alt_text,is_primary,sort_order)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main>
      <section className="hero-editorial">
        <div className="section-wrap grid min-h-[100svh] items-center gap-10 pb-14 pt-12 lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10">
            <span className="micro-label">The pantry · edit 001</span>
            <img
              src="/branding/glided-wordmark.webp"
              alt="The Glided Pantry"
              className="hero-wordmark mt-7"
            />
            <div className="editorial-rule mt-8 w-56" />
            <p className="hero-caption mt-6">
              Global spice, bottled beautifully.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Shop the pantry</Link>
              <Link href="/assistant" className="btn-secondary">What are you cooking?</Link>
            </div>

            <div className="mt-14 flex gap-8 text-[10px] font-semibold uppercase tracking-[.17em] text-neutral-500">
              <span>South Africa</span>
              <span>Retail</span>
              <span>Wholesale</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="absolute -left-10 top-16 size-44 rounded-full bg-violet-300/20 blur-[75px]" />
            <div className="absolute -right-8 bottom-14 size-48 rounded-full bg-amber-300/20 blur-[80px]" />

            <div className="relative float-slow">
              <div className="jar-stage min-h-[34rem]">
                <div className="jar-shell !w-[55%]">
                  <div className="jar-lid" />
                  <div className="absolute inset-[9%_0_0] bg-[linear-gradient(180deg,#d6a239,#9e6212)]" />
                  <div className="jar-label">
                    <img src="/branding/glided-monogram.webp" alt="" className="mx-auto h-12 w-auto invert" />
                    <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[.2em] text-neutral-500">Saffron</span>
                  </div>
                  <div className="jar-shine" />
                </div>
              </div>

              <div className="absolute bottom-16 right-2 rounded-full border border-black/10 bg-white/58 px-4 py-2 text-xs font-semibold backdrop-blur-lg">
                floating pantry · 001
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap py-20 sm:py-28">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <span className="micro-label">Navigate by instinct</span>
            <h2 className="display-font mt-3 text-4xl tracking-[-.035em] sm:text-5xl">How do you want to find it?</h2>
          </div>
          <Link href="/shop" className="hidden text-sm font-semibold sm:block">View everything ↗</Link>
        </div>

        <div className="discovery-strip">
          {discovery.map(([number, label, icon]) => (
            <Link href="/shop" key={label} className="discovery-link group">
              <span className="micro-label">{number}</span>
              <span className="absolute right-5 top-5 text-2xl">{icon}</span>
              <span className="display-font absolute bottom-5 left-5 text-3xl tracking-[-.03em]">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {latestProducts?.length ? (
        <section className="section-wrap py-20 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="micro-label">The current shelf</span>
              <h2 className="display-font mt-3 text-5xl tracking-[-.04em] sm:text-6xl">Floating jars. Real spice.</h2>
            </div>
            <Link href="/shop" className="btn-secondary">Shop all</Link>
          </div>

          <div className="mt-10 grid gap-x-4 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-wrap pb-24 pt-16 sm:pb-32">
        <div className="chrome-panel relative overflow-hidden rounded-[3rem] p-8 sm:p-12 lg:p-16">
          <div className="relative z-10 grid min-h-[24rem] items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/38">Pantry Intelligence</span>
              <h2 className="display-font mt-4 max-w-3xl text-5xl leading-[.95] tracking-[-.045em] sm:text-7xl">
                Start with dinner.
                <span className="block text-white/42">We&apos;ll find the spice.</span>
              </h2>
            </div>
            <Link href="/assistant" className="inline-flex size-28 items-center justify-center rounded-full border border-white/15 bg-white/8 text-center text-sm font-semibold text-white backdrop-blur-xl transition hover:scale-105 hover:bg-white hover:text-black">
              Ask the pantry ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
