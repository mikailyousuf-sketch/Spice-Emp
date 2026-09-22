"use client";

import Link from "next/link";
import { useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="pantry-navbar-shell">
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
            <Link href="/cart" className="pantry-nav-icon" aria-label="Cart"><IconCart /></Link>
            <button type="button" className="pantry-nav-icon" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
              <IconMenu open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      <div className={`menu-scrim ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`menu-panel ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="flex items-center justify-between">
          <img src="/branding/glided-wordmark.svg" alt="The Glided Pantry" className="pantry-menu-brand-image" />
          <button type="button" className="float-control" onClick={() => setMenuOpen(false)} aria-label="Close menu"><IconMenu open /></button>
        </div>
        <nav className="mt-16 grid gap-3">
          {navLinks.map((link,index) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="menu-link">
              <span className="text-xs tabular-nums text-white/35">0{index+1}</span><span>{link.label}</span><span className="ml-auto text-white/30">↗</span>
            </Link>
          ))}
        </nav>
        <p className="mt-auto pt-12 text-xs uppercase tracking-[.2em] text-white/35">South Africa · Retail + Wholesale</p>
      </aside>
    </>
  );
}
