import Link from "next/link";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/recipes", label: "Recipes" },
  { href: "/assistant", label: "AI Spice Assistant" },
  { href: "/business", label: "For Business" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-[1180px] items-center justify-between rounded-full px-4 py-3 sm:px-5">
        <Link href="/" className="display-font flex items-center gap-3 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#ffd27d,#e45b32)] text-sm font-black text-black">
            SE
          </span>
          <span>Spice Emp</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/shop" className="btn-secondary hidden !min-h-10 !px-4 !py-2 text-sm sm:inline-flex">
            Browse
          </Link>
          <Link href="/assistant" className="btn-primary !min-h-10 !px-4 !py-2 text-sm">
            Ask Spice AI
          </Link>
        </div>
      </nav>
    </header>
  );
}
