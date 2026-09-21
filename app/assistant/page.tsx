export const metadata = { title: "AI Spice Assistant" };

export default function AssistantPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <div className="glass rounded-[2.5rem] p-8 sm:p-12">
          <span className="eyebrow">AI Spice Assistant</span>
          <h1 className="display-font mt-6 max-w-4xl text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
            Tell us what you&apos;re cooking.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
            The interface is ready for the next phase: recipe matching and catalogue-grounded
            product recommendations. We won&apos;t fake results before the recipe and product data
            are connected.
          </p>
          <div className="glass-soft mt-10 rounded-3xl p-4 text-stone-500">
            AI query input will activate after the recipe and catalogue services are wired.
          </div>
        </div>
      </section>
    </main>
  );
}
