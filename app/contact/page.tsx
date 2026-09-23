import Link from "next/link";

export const metadata = {
  title: "Contact",
  description: "Contact The Glided Pantry for retail support, wholesale supply or partnerships.",
};

const cards = [
  {
    title: "Orders & support",
    body: "Already ordered? Your account keeps your order status, delivery method and tracking information together.",
    href: "/account/orders",
    action: "View my orders",
    note: "Direct support contact details will be published before public launch.",
  },
  {
    title: "Wholesale",
    body: "Restaurants, caterers, hospitality groups, retailers and food businesses can request bulk pricing directly.",
    href: "/business",
    action: "Request wholesale pricing",
    note: "Quote requests go directly into the wholesale admin queue.",
  },
  {
    title: "Partnerships",
    body: "Supply, logistics, technology and commercial partnership enquiries will have a dedicated channel.",
    href: null,
    action: null,
    note: "Partnership contact details will be published before public launch.",
  },
];

export default function ContactPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-20 sm:py-28">
        <span className="eyebrow">Contact</span>
        <h1 className="display-font mt-6 max-w-4xl text-balance text-6xl font-semibold tracking-[-.06em] sm:text-7xl">
          The right place for every enquiry.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-400">
          Order support and wholesale already have dedicated routes inside The Glided Pantry.
          Public support and partnership contact details will be added here before launch.
        </p>
      </section>

      <section className="section-wrap grid gap-5 pb-28 lg:grid-cols-3">
        {cards.map((card, index) => (
          <article key={card.title} className="glass-soft contact-card rounded-[2rem] p-7">
            <span className="contact-card-number">0{index + 1}</span>
            <h2 className="display-font mt-10 text-2xl font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">{card.body}</p>

            {card.href && card.action ? (
              <Link href={card.href} className="contact-card-action">
                {card.action} <span>→</span>
              </Link>
            ) : null}

            <p className="contact-card-note">
              {card.note}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
