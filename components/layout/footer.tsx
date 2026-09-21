import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="section-wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display-font text-2xl font-bold">Spice Emp</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-stone-400">
            A modern spice discovery and commerce platform built for South African kitchens,
            chefs and businesses.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold text-white">Explore</p>
          <div className="grid gap-2 text-sm text-stone-400">
            <Link href="/shop">Shop spices</Link>
            <Link href="/recipes">Recipes</Link>
            <Link href="/assistant">AI Spice Assistant</Link>
            <Link href="/business">Wholesale</Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold text-white">Company</p>
          <div className="grid gap-2 text-sm text-stone-400">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="section-wrap border-t border-white/10 py-5 text-xs text-stone-500">
        © {new Date().getFullYear()} Spice Emp. South Africa.
      </div>
    </footer>
  );
}
