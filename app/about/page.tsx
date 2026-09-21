import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = {
  title: "About",
  description: "Why Spice Emp is building a new kind of spice marketplace for South Africa.",
};

export default function AboutPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-20 sm:py-28">
        <span className="eyebrow">About Spice Emp</span>
        <h1 className="display-font mt-6 max-w-5xl text-balance text-6xl font-semibold tracking-[-.06em] sm:text-7xl">
          A smarter way to discover, buy and reorder flavour.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-400">
          Spice Emp is being built as a South African spice discovery and commerce platform for
          home cooks, chefs, restaurants and food businesses.
        </p>
      </section>

      <section className="section-wrap grid gap-5 pb-24 lg:grid-cols-3">
        {[
          ["01", "Discovery first", "We organise spices around cuisine, food, flavour, heat and cooking method — the way people actually think about meals."],
          ["02", "Commerce grounded in reality", "AI recommendations will map to real recipes, real catalogue products, current stock and current pricing."],
          ["03", "Built for both kitchens", "The same platform is being designed for a home cook buying 100g and a restaurant ordering in kilograms."],
        ].map(([number, title, body]) => (
          <article key={title} className="glass-soft rounded-[2rem] p-7">
            <p className="text-xs text-stone-600">{number}</p>
            <h2 className="display-font mt-12 text-2xl font-semibold">{title}</h2>
            <p className="mt-4 text-sm leading-7 text-stone-400">{body}</p>
          </article>
        ))}
      </section>

      <section className="section-wrap py-24">
        <div className="glass rounded-[2.5rem] p-8 sm:p-12">
          <SectionHeading
            eyebrow="The ambition"
            title="Not another spice website."
            body="The long-term vision is a platform where recipes, pantry intelligence, wholesale procurement and spice discovery work together — making it easier to decide what to cook, understand what you need, and buy only what makes sense."
          />
          <div className="mt-10">
            <Link href="/shop" className="btn-primary">Explore the platform</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
