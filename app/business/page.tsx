import Link from "next/link";
import { WholesaleEnquiry } from "@/components/business/wholesale-enquiry";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export const metadata = {
  title: "Wholesale & Business",
  description: "Wholesale spice supply for restaurants, hospitality, catering, retailers and food businesses.",
};

export default async function BusinessPage({ searchParams }: Props) {
  const { sent, error } = await searchParams;
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id,name")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="business-page">
      <section className="section-wrap business-shell">
        <header className="business-hero">
          <div>
            <p className="pantry-kicker">Wholesale · South Africa</p>
            <h1>Built for kitchens that buy in kilos.</h1>
          </div>
          <div className="business-hero-side">
            <p>
              Restaurants, caterers, hospitality groups, retailers and food businesses can request
              bulk pricing from the same pantry catalogue.
            </p>
            <Link href="/shop">Browse retail pantry →</Link>
          </div>
        </header>

        <div className="business-value-row">
          <div><span>01</span><strong>Bulk supply</strong><p>Request kilo-volume pricing across the live catalogue.</p></div>
          <div><span>02</span><strong>Repeat ordering</strong><p>Tell us how often you buy so we can structure supply around your kitchen.</p></div>
          <div><span>03</span><strong>One relationship</strong><p>Retail staples, food-service packs and future custom blends in one place.</p></div>
        </div>

        {sent ? (
          <div className="business-success">
            <span>Quote request received</span>
            <h2>We&apos;ve got your list.</h2>
            <p>Your request is now in the wholesale admin queue for review.</p>
            <Link href="/shop">Continue browsing →</Link>
          </div>
        ) : null}

        {error ? <p className="business-error">{error}</p> : null}

        {products?.length ? (
          <WholesaleEnquiry products={products} />
        ) : (
          <div className="business-empty">
            The wholesale request form will activate as soon as live products are available in the catalogue.
          </div>
        )}
      </section>
    </main>
  );
}
