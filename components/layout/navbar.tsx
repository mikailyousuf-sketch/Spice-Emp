import Link from "next/link";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/recipes", label: "Recipes" },
  { href: "/assistant", label: "Pantry AI" },
  { href: "/business", label: "Wholesale" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-[1240px] items-center justify-between rounded-full px-4 py-3 sm:px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-black/10 bg-black text-xs font-black tracking-[.14em] text-white">
            GP
          </span>
          <span className="script-accent text-[1.72rem] leading-none">The Glided Pantry</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/shop" className="btn-secondary hidden !min-h-10 !px-4 !py-2 text-sm sm:inline-flex">
            Search pantry
          </Link>
          <Link href="/cart" className="btn-primary !min-h-10 !px-4 !py-2 text-sm">
            Cart
          </Link>
        </div>
      </nav>
    </header>
  );
}
