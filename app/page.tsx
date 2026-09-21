import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { getProductImageUrl } from "@/lib/products/image-url";
import { createClient } from "@/lib/supabase/server";

const discovery = [
  { href: "/shop", title: "By Cuisine", note: "Explore flavours", icon: "◎" },
  { href: "/shop", title: "By Dish", note: "Find your pairing", icon: "⋮" },
  { href: "/shop", title: "By Flavour", note: "Bold to refined", icon: "✧" },
  { href: "/shop", title: "By Heat", note: "Mild to extra hot", icon: "⌁" },
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

  const heroProduct = latestProducts?.[0];
  const heroImage = heroProduct
    ? [...(heroProduct.product_images ?? [])].sort(
        (a,b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      )[0]
    : null;
  const heroImageUrl = getProductImageUrl(heroImage?.storage_path);

  return (
    <main>
      <section className="hero-luxury">
        <div className="section-wrap grid min-h-[100svh] items-center gap-6 pb-24 pt-32 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative z-10 max-w-2xl">
            <p className="micro-label">Exceptional spices for a more flavourful world</p>
            <h1 className="hero-title mt-6">
              More flavour.
              <span className="block text-white/62">A richer story.</span>
            </h1>
            <p className="hero-copy mt-7">
              Premium spices, global flavours, and a pantry built around the way you actually cook.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Shop spices →</Link>
              <Link href="/about" className="btn-secondary">Our story</Link>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-semibold uppercase tracking-[.24em] text-white/38">
              <span>People</span>
              <span>Places</span>
              <span>Flavours</span>
              <span>A brighter table</span>
            </div>
          </div>

          <div className="hero-jar-wrap">
            <div className="hero-jar">
              <div className="jar-lid" />
              {heroImageUrl ? (
                <img src={heroImageUrl} alt={heroImage?.alt_text || heroProduct?.name || "Featured spice"} className="hero-jar-image" />
              ) : (
                <div className="hero-jar-fill" />
              )}
              <div className="hero-jar-label">
                <span className="block text-[10px] font-semibold uppercase tracking-[.28em] text-white/45">The Glided Pantry</span>
                <span className="display-font mt-3 block text-3xl italic">
                  {heroProduct?.name || "Signature Spice"}
                </span>
                <span className="mt-2 block text-[9px] uppercase tracking-[.2em] text-white/45">
                  Pure · Rare · Remarkable
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-nav-strip">
        {discovery.map((item) => (
          <Link href={item.href} className="glass-nav-item group" key={item.title}>
            <div className="flex items-center gap-3">
              <span className="text-xl text-white/70">{item.icon}</span>
              <div>
                <p className="display-font text-xl italic">{item.title}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[.18em] text-white/42">{item.note}</p>
              </div>
              <span className="ml-auto text-white/30 transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>

      {latestProducts?.length ? (
        <section className="dark-stone relative py-24 sm:py-32">
          <div className="section-wrap relative z-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="micro-label">Our signature collection</p>
                <h2 className="catalogue-heading mt-4 max-w-3xl">Extraordinary spices for everyday rituals.</h2>
              </div>
              <Link href="/shop" className="btn-secondary w-fit">View all →</Link>
            </div>

            <div className="mt-12 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestProducts.slice(0,4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="stone-section py-24 sm:py-28">
        <div className="section-wrap relative z-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="micro-label !text-black/45">More than spices</p>
            <h2 className="display-font mt-4 max-w-xl text-6xl leading-[.88] tracking-[-.04em] text-[#171513]">
              A deeper connection to flavour.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border-l border-black/15 pl-6">
              <p className="text-sm leading-7 text-black/55">
                Sourced from remarkable places. Chosen for a more flavourful life.
              </p>
              <Link href="/about" className="mt-5 inline-flex text-xs font-bold uppercase tracking-[.18em] text-black">
                Our story →
              </Link>
            </div>
            <div className="rounded-[2rem] bg-[#191614] p-7 text-white shadow-2xl">
              <p className="micro-label">Pantry intelligence</p>
              <p className="display-font mt-4 text-4xl leading-none">Tell us what you&apos;re cooking.</p>
              <Link href="/assistant" className="mt-7 inline-flex text-xs font-bold uppercase tracking-[.18em]">
                Ask the pantry →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
