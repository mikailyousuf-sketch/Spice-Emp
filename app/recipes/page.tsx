export const metadata = { title: "Recipes" };

export default function RecipesPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <span className="eyebrow">Recipes</span>
        <h1 className="display-font mt-6 max-w-4xl text-6xl font-semibold tracking-[-.055em]">
          Recipes that connect directly to your spice shelf.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          Recipe content will be database-backed and mapped to catalogue products so every future
          recommendation can resolve to real spice IDs and variants.
        </p>
      </section>
    </main>
  );
}
