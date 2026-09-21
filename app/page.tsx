import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";

const discovery = [
  ["Cuisine", "Indian, Moroccan, Thai, Mexican and more", "01"],
  ["Dish", "Chicken, lamb, seafood, braai, rice and more", "02"],
  ["Flavour", "Smoky, earthy, citrusy, herby, sweet or hot", "03"],
  ["Heat", "From zero burn to serious fire", "04"],
];

const pantry = [
  { name: "Turmeric", tone: "from-[#d8a52d] to-[#8d5d10]" },
  { name: "Kashmiri chilli", tone: "from-[#d24d3c] to-[#6f1815]" },
  { name: "Cumin", tone: "from-[#a87942] to-[#4b321f]" },
  { name: "Coriander", tone: "from-[#9c8d51] to-[#4c4724]" },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[100svh] overflow-hidden pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="glow-ring left-[-9rem] top-[9rem] size-[24rem] opacity-70" />
          <div className="glow-ring right-[-6rem] top-[18rem] size-[20rem] opacity-40" />
          <div className="absolute left-1/2 top-[20%] h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[110px]" />
        </div>

        <div className="section-wrap relative grid min-h-[calc(100svh-9rem)] items-center gap-14 pb-20 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10">
            <span className="eyebrow">South Africa&apos;s spice discovery platform</span>
            <h1 className="display-font mt-6 max-w-4xl text-balance text-6xl font-semibold tracking-[-0.065em] sm:text-7xl lg:text-[6rem] lg:leading-[.94]">
              Your pantry,
              <span className="block bg-[linear-gradient(90deg,#fff3d3,#ffba49,#e45b32)] bg-clip-text text-transparent">
                reimagined.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-stone-400 sm:text-xl">
              Discover spices by what you cook, how you cook and the flavours you love.
              Built for home kitchens and serious food businesses.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/assistant" className="btn-primary">
                Tell us what you&apos;re cooking
                <span aria-hidden>↗</span>
              </Link>
              <Link href="/shop" className="btn-secondary">
                Explore the pantry
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-stone-500">
              <span>Retail + wholesale</span>
              <span>Catalogue-grounded AI</span>
              <span>Built in South Africa</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl py-10">
            <div className="glass float-slow relative overflow-hidden rounded-[2.2rem] p-5 shadow-2xl shadow-orange-950/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-stone-500">Clear Pantry</p>
                  <p className="display-font mt-1 text-xl font-semibold">Tonight&apos;s flavour shelf</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-400">
                  Live concept
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-5">
                {pantry.map((item, index) => (
                  <div key={item.name} className="glass-soft group rounded-3xl p-4">
                    <div className="relative mb-5 h-36 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                      <div
                        className={`absolute bottom-[-1.8rem] left-1/2 h-32 w-24 -translate-x-1/2 rounded-[2rem_2rem_1rem_1rem] bg-gradient-to-b ${item.tone} shadow-[0_0_40px_rgba(255,170,70,.15)] transition duration-500 group-hover:-translate-y-2`}
                      />
                      <div className="absolute inset-x-0 top-4 text-center text-[10px] uppercase tracking-[.28em] text-white/35">
                        Jar {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <p className="display-font font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-stone-500">Pantry essential</p>
                  </div>
                ))}
              </div>

              <div className="glass-soft rounded-3xl p-4">
                <p className="text-xs uppercase tracking-[.18em] text-orange-200/70">Ask Spice AI</p>
                <p className="mt-2 text-sm text-stone-300">
                  “I&apos;m making butter chicken for 6 people.”
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#ffba49,#e45b32)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap py-24 sm:py-32">
        <SectionHeading
          eyebrow="Discover differently"
          title="Don’t search a warehouse. Explore flavour."
          body="Spice Emp is being designed around how people actually cook — by cuisine, dish, flavour, heat and method — instead of forcing everyone through a generic product catalogue."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {discovery.map(([title, text, number]) => (
            <div key={title} className="glass-soft group rounded-[2rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-orange-200/20">
              <div className="mb-14 flex items-center justify-between">
                <span className="text-xs text-stone-600">{number}</span>
                <span className="text-stone-600 transition group-hover:text-orange-200">↗</span>
              </div>
              <h3 className="display-font text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-wrap py-24 sm:py-32">
        <div className="glass relative overflow-hidden rounded-[2.5rem] p-7 sm:p-10 lg:p-14">
          <div className="absolute right-[-10%] top-[-35%] size-[30rem] rounded-full bg-orange-500/12 blur-[110px]" />
          <div className="relative grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <span className="eyebrow">AI Spice Assistant</span>
              <h2 className="display-font mt-5 text-balance text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
                Start with dinner. We&apos;ll find the spice shelf.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-stone-400">
                Ask for a dish and servings. The assistant will be connected to real recipes
                and real catalogue products — never invented stock, prices or products.
              </p>
              <Link href="/assistant" className="btn-primary mt-8">
                Open Spice AI
              </Link>
            </div>

            <div className="glass-soft rounded-[2rem] p-5 sm:p-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
                I want to make butter chicken for 6 people.
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["Garam Masala", "2 tbsp"],
                  ["Cumin", "1 tsp"],
                  ["Coriander", "2 tsp"],
                  ["Kashmiri Chilli", "1 tbsp"],
                ].map(([spice, amount]) => (
                  <div key={spice} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <span>{spice}</span>
                    <span className="text-stone-500">{amount}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgba(255,186,73,.16),rgba(228,91,50,.12))] p-4 text-sm text-orange-100">
                Catalogue matching will be powered by live product IDs, stock and pricing.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap py-24 sm:py-32">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass-soft min-h-[26rem] rounded-[2.5rem] p-8 sm:p-10">
            <span className="eyebrow">For home</span>
            <h2 className="display-font mt-6 max-w-lg text-4xl font-semibold tracking-[-.04em]">
              Build a pantry that actually matches the way you cook.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-stone-400">
              Explore global cuisines, discover blends, save favourites and eventually let your
              pantry tell you what you already own before you buy.
            </p>
            <Link href="/shop" className="btn-secondary mt-8">
              Explore retail
            </Link>
          </div>

          <div className="relative min-h-[26rem] overflow-hidden rounded-[2.5rem] border border-orange-200/15 bg-[radial-gradient(circle_at_70%_20%,rgba(255,186,73,.15),transparent_35%),linear-gradient(145deg,#19120d,#0b0907)] p-8 sm:p-10">
            <div className="absolute -bottom-20 -right-20 size-72 rounded-full border border-orange-300/15 shadow-[0_0_100px_rgba(228,91,50,.15)]" />
            <span className="eyebrow">For business</span>
            <h2 className="display-font mt-6 max-w-lg text-4xl font-semibold tracking-[-.04em]">
              Wholesale spice buying without the old-school friction.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-stone-400">
              Bulk variants, business pricing, quote requests and saved repeat orders are being
              built into the same platform from day one.
            </p>
            <Link href="/business" className="btn-primary mt-8">
              Explore wholesale
            </Link>
          </div>
        </div>
      </section>

      <section className="section-wrap py-24 text-center sm:py-36">
        <span className="eyebrow">The new spice shelf</span>
        <h2 className="display-font mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
          From “what&apos;s for dinner?” to the right spices in your cart.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          We&apos;re building the shopping experience around food, not inventory spreadsheets.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <Link href="/assistant" className="btn-primary">Try the concept</Link>
          <Link href="/about" className="btn-secondary">Why Spice Emp</Link>
        </div>
      </section>
    </main>
  );
}
