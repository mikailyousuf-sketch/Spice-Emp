import type { ReactNode } from "react";
import Link from "next/link";

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated = "23 September 2026",
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page pt-32">
      <section className="section-wrap py-20 sm:py-24">
        <div className="legal-hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <span className="legal-updated">Last updated · {updated}</span>
        </div>

        <div className="legal-layout">
          <aside className="legal-nav">
            <span>Customer information</span>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns & refunds</Link>
            <Link href="/privacy">Privacy & POPIA</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/allergens">Allergens & food notice</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </aside>

          <article className="legal-content">{children}</article>
        </div>
      </section>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
