import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0c0b] text-white">
      <div className="section-wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <img src="/branding/glided-wordmark.webp" alt="The Glided Pantry" className="w-64" />
          <p className="mt-5 max-w-md text-sm leading-6 text-white/45">
            Premium spices, global flavour, and a pantry built around the way you cook.
          </p>
        </div>

        <div>
          <p className="micro-label">Explore</p>
          <div className="mt-4 grid gap-2 text-sm text-white/48">
            <Link href="/shop">Shop</Link>
            <Link href="/recipes">Recipes</Link>
            <Link href="/assistant">Pantry AI</Link>
            <Link href="/business">Wholesale</Link>
          </div>
        </div>

        <div>
          <p className="micro-label">Company</p>
          <div className="mt-4 grid gap-2 text-sm text-white/48">
            <Link href="/about">Our story</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="section-wrap flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-[10px] uppercase tracking-[.16em] text-white/30">
        <span>© {new Date().getFullYear()} The Glided Pantry</span>
        <span>A more flavourful world</span>
      </div>
    </footer>
  );
}
