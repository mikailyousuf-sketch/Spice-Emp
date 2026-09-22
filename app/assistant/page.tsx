import Link from "next/link";
import { SpiceAssistant } from "@/components/assistant/spice-assistant";

export const metadata = {
  title: "Spice Assistant",
  description: "Tell The Glided Pantry what you're cooking and discover matching spices from the live catalogue.",
};

export default function AssistantPage() {
  return (
    <main className="assistant-page">
      <section className="section-wrap assistant-shell">
        <header className="assistant-hero">
          <div>
            <p className="pantry-kicker">Ask the pantry</p>
            <h1>Tell us what you&apos;re cooking.</h1>
          </div>
          <div className="assistant-hero-side">
            <p>
              Describe the dish, ingredient, cuisine, flavour or heat you want.
              The assistant searches only the products that actually exist in The Glided Pantry.
            </p>
            <Link href="/shop">Browse manually →</Link>
          </div>
        </header>

        <SpiceAssistant />

        <footer className="assistant-footer-line">
          <span />
          <p>Real pantry data · No invented stock · No made-up prices</p>
          <span />
        </footer>
      </section>
    </main>
  );
}
