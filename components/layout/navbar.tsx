"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "Our story" },
  { href: "/shop", label: "Spices" },
  { href: "/assistant", label: "Ask pantry" },
  { href: "/recipes", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

function IconSearch() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
}
function IconCart() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 5h2l1.6 9.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L21 8H6.2"/><circle cx="9.5" cy="19" r="1"/><circle cx="17.5" cy="19" r="1"/></svg>;
}
function IconMenu({ open }: { open: boolean }) {
  return <span className="relative block size-5" aria-hidden="true">
    <span className={`absolute left-0 top-[6px] h-px w-5 bg-current transition ${open ? "translate-y-[4px] rotate-45" : ""}`} />
    <span className={`absolute left-0 top-[10px] h-px w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
    <span className={`absolute left-0 top-[14px] h-px w-5 bg-current transition ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
  </span>;
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refreshCartCount() {
      try {
        const response = await fetch("/api/cart/count", { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled) setCartCount(Number(payload.count) || 0);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    }

    void refreshCartCount();
    const interval = window.setInterval(refreshCartCount, 1500);
    const onFocus = () => void refreshCartCount();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshCartCount();
    };

    const onCartAdd = (event: Event) => {
      const detail = (event as CustomEvent<{ quantity?: number }>).detail;
      const quantity = Math.max(1, Number(detail?.quantity) || 1);
      setCartCount((current) => current + quantity);
      window.setTimeout(() => void refreshCartCount(), 350);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("pantry:cart-add", onCartAdd as EventListener);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pantry:cart-add", onCartAdd as EventListener);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return (
    <>
      <header className={`pantry-navbar-shell ${menuOpen ? "is-menu-open" : ""}`}>
        <div className="pantry-navbar">
          <Link href="/" className="pantry-brand-link" aria-label="The Glided Pantry home">
            <img src="/branding/glided-wordmark.svg" alt="The Glided Pantry" className="pantry-brand-image" />
          </Link>

          <nav className="pantry-nav-links" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>

          <div className="pantry-nav-actions">
            <Link href="/shop#pantry-search" className="pantry-nav-icon" aria-label="Search pantry"><IconSearch /></Link>
            <Link
              href="/cart"
              className="pantry-nav-icon pantry-cart-control"
              aria-label={cartCount > 0 ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Cart"}
            >
              <IconCart />
              {cartCount > 0 ? (
                <span className="pantry-cart-count" aria-hidden="true">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            <button type="button" className="pantry-nav-icon" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
              <IconMenu open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      <div className={`menu-scrim ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`menu-panel ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="menu-panel-top">
          <img src="/branding/glided-wordmark.svg" alt="The Glided Pantry" className="pantry-menu-brand-image" />
          <button type="button" className="menu-close-control" onClick={() => setMenuOpen(false)} aria-label="Close menu"><IconMenu open /></button>
        </div>

        <div className="menu-panel-intro">
          <span>Pantry navigation</span>
          <p>Spices, discovery and your account — all in one place.</p>
        </div>

        <nav className="menu-panel-links" aria-label="Menu navigation">
          {navLinks.map((link,index) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="menu-link">
              <span className="menu-link-number">0{index+1}</span>
              <span>{link.label}</span>
              <span className="menu-link-arrow">↗</span>
            </Link>
          ))}
        </nav>

        <div className="menu-panel-quick">
          <Link href="/account" onClick={() => setMenuOpen(false)}>My account <span>→</span></Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)}>Cart <span>→</span></Link>
          <Link href="/business" onClick={() => setMenuOpen(false)}>Wholesale <span>→</span></Link>
        </div>

        <p className="menu-panel-foot">South Africa · Retail + Wholesale</p>
      </aside>
    </>
  );
}
