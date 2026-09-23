import Link from "next/link";

export const metadata = {
  title: "Contact",
  description: "Contact The Glided Pantry for retail support, wholesale supply or partnerships.",
};

const cards = [
  {
    title: "Orders & support",
    body: "Need help with an order, payment, delivery or product issue? Email us and include your order number where possible.",
    href: "mailto:theglidedpantry.co.za@gmail.com",
    action: "Email support",
    note: "theglidedpantry.co.za@gmail.com",
  },
  {
    title: "Wholesale",
    body: "Restaurants, caterers, hospitality groups, retailers and food businesses can request bulk pricing directly.",
    href: "/business",
    action: "Request wholesale pricing",
    note: "Quotes flow directly into the wholesale admin pipeline.",
  },
  {
    title: "Orders in your account",
    body: "Signed-in customers can review order history, status, delivery information and tracking references from their account.",
    href: "/account/orders",
    action: "View my orders",
    note: "Use this first when you only need a status update.",
  },
];

export default function ContactPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-20 sm:py-28">
        <span className="eyebrow">Contact</span>
        <h1 className="display-font mt-6 max-w-4xl text-balance text-6xl font-semibold tracking-[-.06em] sm:text-7xl">
          Support without the runaround.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-500">
          Retail support, wholesale enquiries and order tracking each have a clear route.
          For direct assistance, email the pantry and we’ll work from the order or enquiry details you provide.
        </p>

        <div className="contact-direct mt-8">
          <span>Primary support email</span>
          <a href="mailto:theglidedpantry.co.za@gmail.com">theglidedpantry.co.za@gmail.com</a>
        </div>
      </section>

      <section className="section-wrap grid gap-5 pb-16 lg:grid-cols-3">
        {cards.map((card, index) => (
          <article key={card.title} className="glass-soft contact-card rounded-[2rem] p-7">
            <span className="contact-card-number">0{index + 1}</span>
            <h2 className="display-font mt-10 text-2xl font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">{card.body}</p>

            {card.href.startsWith("mailto:") ? (
              <a href={card.href} className="contact-card-action">
                {card.action} <span>→</span>
              </a>
            ) : (
              <Link href={card.href} className="contact-card-action">
                {card.action} <span>→</span>
              </Link>
            )}

            <p className="contact-card-note">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="section-wrap pb-28">
        <div className="contact-trust-panel">
          <div>
            <span>Before you contact us</span>
            <h2>Useful information to include</h2>
          </div>
          <div className="contact-trust-grid">
            <div><strong>Order support</strong><p>Order number, email used at checkout and a short description of the issue.</p></div>
            <div><strong>Product issue</strong><p>Product name, batch or best-before information where visible, plus photos if damaged or incorrect.</p></div>
            <div><strong>Wholesale</strong><p>Business name, estimated quantities, product list and ordering frequency.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
