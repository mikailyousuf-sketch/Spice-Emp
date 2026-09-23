import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0c0b] text-white">
      <div className="section-wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src="/branding/glided-wordmark.svg" alt="The Glided Pantry" className="footer-brand-image" />
          <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
            Premium spices, global flavour, and a pantry built around the way you cook.
          </p>
          <div className="footer-trust mt-6">
            <span>Secure online payments</span>
            <span>POPIA-aware data handling</span>
            <span>South African delivery</span>
          </div>
        </div>

        <div>
          <p className="micro-label">Explore</p>
          <div className="mt-4 grid gap-2 text-sm text-white/58">
            <Link href="/shop">Shop</Link>
            <Link href="/assistant">Pantry AI</Link>
            <Link href="/business">Wholesale</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>

        <div>
          <p className="micro-label">Customer care</p>
          <div className="mt-4 grid gap-2 text-sm text-white/58">
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns & refunds</Link>
            <Link href="/allergens">Allergens & food notice</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>

        <div>
          <p className="micro-label">Legal</p>
          <div className="mt-4 grid gap-2 text-sm text-white/58">
            <Link href="/privacy">Privacy & POPIA</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:theglidedpantry.co.za@gmail.com">Email support</a>
          </div>
        </div>
      </div>

      <div className="section-wrap border-t border-white/10 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[.16em] text-white/38">
          <span>© {new Date().getFullYear()} The Glided Pantry</span>
          <span>theglidedpantry.co.za@gmail.com</span>
        </div>
        <p className="mt-3 max-w-4xl text-[10px] leading-5 text-white/32">
          Product and allergen information on physical packaging should be checked before use.
          Pantry AI recommendations are for culinary discovery and are not medical or dietary advice.
        </p>
      </div>
    </footer>
  );
}
