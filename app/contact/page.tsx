export const metadata = {
  title: "Contact",
  description: "Get in touch with Spice Emp for retail, wholesale or partnership enquiries.",
};

const cards = [
  {
    title: "Retail & support",
    body: "Questions about products, ordering or the platform.",
    status: "Contact channel being configured",
  },
  {
    title: "Wholesale",
    body: "Restaurants, caterers, hotels, manufacturers and bulk buyers.",
    status: "Wholesale onboarding in development",
  },
  {
    title: "Partnerships",
    body: "Supply, logistics, technology or commercial partnerships.",
    status: "Partnership channel being configured",
  },
];

export default function ContactPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-20 sm:py-28">
        <span className="eyebrow">Contact</span>
        <h1 className="display-font mt-6 max-w-4xl text-balance text-6xl font-semibold tracking-[-.06em] sm:text-7xl">
          Let&apos;s talk flavour, supply or scale.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-400">
          We&apos;re setting up the production contact channels now. This page already separates
          retail, wholesale and partnership enquiries so the backend can route them correctly later.
        </p>
      </section>

      <section className="section-wrap grid gap-5 pb-28 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="glass-soft rounded-[2rem] p-7">
            <div className="mb-14 size-11 rounded-2xl border border-orange-200/15 bg-orange-300/10" />
            <h2 className="display-font text-2xl font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">{card.body}</p>
            <p className="mt-8 border-t border-white/10 pt-4 text-xs uppercase tracking-[.14em] text-stone-600">
              {card.status}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
