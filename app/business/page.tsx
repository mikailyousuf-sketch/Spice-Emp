export const metadata = { title: "For Business" };

export default function BusinessPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <span className="eyebrow">Wholesale</span>
        <h1 className="display-font mt-6 max-w-4xl text-6xl font-semibold tracking-[-.055em]">
          Built for kitchens that buy in kilos.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          Business registration, tiered pricing, bulk variants, quote requests and saved orders
          are part of the planned B2B layer and will connect to the same core catalogue.
        </p>
      </section>
    </main>
  );
}
