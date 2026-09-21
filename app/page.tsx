export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-orange-800">
          South African spice marketplace
        </p>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          Spices from around the world, in one place.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
          Shop by cuisine, dish, flavour and heat — then use our recipe-aware
          spice assistant to find exactly what you need.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            className="rounded-full bg-orange-800 px-6 py-3 font-semibold text-white"
            href="/shop"
          >
            Explore spices
          </a>
          <a
            className="rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold"
            href="/assistant"
          >
            What are you cooking?
          </a>
        </div>
      </section>
    </main>
  );
}
