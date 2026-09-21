import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { createClient } from "@/lib/supabase/server";

const discovery = [
  ["🌍", "Cuisine", "Indian, Moroccan, Thai, Mexican and more"],
  ["🍛", "Dish", "Chicken, lamb, seafood, braai, rice and more"],
  ["✨", "Flavour", "Smoky, earthy, citrusy, herby, sweet or hot"],
  ["🌶", "Heat", "From gentle warmth to serious fire"],
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
      <section className="relative min-h-[100svh] overflow-hidden pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[20%] size-80 rounded-full bg-violet-300/20 blur-[120px]" />
          <div className="absolute right-[7%] top-[16%] size-80 rounded-full bg-amber-300/20 blur-[120px]" />
          <div className="absolute left-1/2 top-[35%] h-px w-[78%] -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        </div>

        <div className="section-wrap relative grid min-h-[calc(100svh-9rem)] items-center gap-12 pb-16 lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10">
            <span className="eyebrow">A different kind of spice shop</span>
            <h1 className="display-font mt-6 max-w-4xl text-balance text-7xl font-semibold leading-[.88] tracking-[-.055em] sm:text-8xl lg:text-[7.4rem]">
              The Glided
              <span className="script-accent block font-normal text-neutral-500">Pantry.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-500 sm:text-xl">
              Premium spices, floating off the shelf and organised around the way you actually cook.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Enter the pantry ↗</Link>
              <Link href="/assistant" className="btn-secondary">Tell us what you&apos;re cooking</Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-xs font-semibold uppercase tracking-[.13em] text-neutral-400">
              <span>Retail + wholesale</span>
              <span>South Africa</span>
              <span>Smart culinary discovery</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[36rem] py-10">
            <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10" />
            <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/30" />

            <div className="glass float-slow relative mx-auto max-w-md rounded-[3rem] p-7">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-neutral-400">Featured shelf</p>
                <p className="script-accent mt-2 text-4xl">Spice, displayed differently.</p>
              </div>

              <div className="jar-stage mt-2 min-h-[24rem]">
                <div className="jar-shell !w-[58%]">
                  <div className="jar-lid" />
                  <div className="absolute inset-[9%_0_0] bg-[linear-gradient(180deg,#dfaf48,#a26416)]" />
                  <div className="jar-label">
                    <span className="script-accent block text-3xl leading-none text-black">Saffron Glow</span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[.18em] text-neutral-500">The Glided Pantry</span>
                  </div>
                  <div className="jar-shine" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap py-24 sm:py-32">
        <div className="text-center">
          <span className="eyebrow">Discover differently</span>
          <h2 className="display-font mx-auto mt-5 max-w-3xl text-5xl font-semibold tracking-[-.045em] sm:text-6xl">
            Shop the pantry by <span className="script-accent font-normal">instinct.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {discovery.map(([icon, title, text]) => (
            <Link href="/shop" key={title} className="glass-soft group rounded-[2rem] p-6 transition duration-300 hover:-translate-y-1">
              <span className="text-3xl">{icon}</span>
              <h3 className="display-font mt-10 text-3xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">{text}</p>
              <span className="mt-6 inline-block text-sm text-neutral-400 transition group-hover:translate-x-1">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {latestProducts?.length ? (
        <section className="section-wrap py-24 sm:py-32">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="eyebrow">From the shelf</span>
              <h2 className="display-font mt-5 text-5xl font-semibold tracking-[-.045em] sm:text-6xl">
                Pantry <span className="script-accent font-normal">favourites.</span>
              </h2>
            </div>
            <Link href="/shop" className="btn-secondary">View all jars</Link>
          </div>

          <div className="mt-12 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-wrap py-24 sm:py-32">
        <div className="glass-dark relative overflow-hidden rounded-[3rem] p-8 sm:p-12 lg:p-16">
          <div className="absolute -right-16 -top-24 size-80 rounded-full bg-violet-400/20 blur-[100px]" />
          <div className="absolute -bottom-28 left-[35%] size-72 rounded-full bg-amber-300/15 blur-[90px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[.18em] text-white/45">Pantry AI</span>
              <h2 className="display-font mt-5 max-w-3xl text-5xl font-semibold tracking-[-.045em] sm:text-6xl">
                Start with the dish, not the shopping list.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
                Tell us what you&apos;re making. The assistant will eventually match recipes to real products, real sizes and real stock from The Glided Pantry.
              </p>
            </div>
            <div className="lg:text-right">
              <Link href="/assistant" className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:-translate-y-1">
                Ask the pantry →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
