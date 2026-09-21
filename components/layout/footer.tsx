import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white/30">
      <div className="section-wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="script-accent text-4xl">The Glided Pantry</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-neutral-500">
            A modern South African pantry for premium spices, global flavour and smarter culinary discovery.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold text-black">Explore</p>
          <div className="grid gap-2 text-sm text-neutral-500">
            <Link href="/shop">Shop the pantry</Link>
            <Link href="/recipes">Recipes</Link>
            <Link href="/assistant">Pantry AI</Link>
            <Link href="/business">Wholesale</Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold text-black">Company</p>
          <div className="grid gap-2 text-sm text-neutral-500">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="section-wrap border-t border-black/10 py-5 text-xs text-neutral-400">
        © {new Date().getFullYear()} The Glided Pantry. South Africa.
      </div>
    </footer>
  );
}
