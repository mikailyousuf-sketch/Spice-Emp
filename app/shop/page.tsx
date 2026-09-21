export const metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <span className="eyebrow">Shop spices</span>
        <h1 className="display-font mt-6 max-w-4xl text-6xl font-semibold tracking-[-.055em]">
          The catalogue is next.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          The visual shell is live. The next build step connects this page to the Supabase
          catalogue, variants, taxonomy, inventory and search.
        </p>
      </section>
    </main>
  );
}
