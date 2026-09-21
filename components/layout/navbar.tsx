"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/recipes", label: "Recipes" },
  { href: "/assistant", label: "Pantry AI" },
  { href: "/business", label: "Wholesale" },
  { href: "/about", label: "Our story" },
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
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="mx-auto flex max-w-[1450px] items-start justify-between">
          <Link href="/" className="pointer-events-auto brand-float brand-float-logo" aria-label="The Glided Pantry home">
            <img src="/branding/glided-wordmark.webp" alt="The Glided Pantry" className="brand-wordmark" />
          </Link>
          <div className="pointer-events-auto flex items-center gap-2">
            <Link href="/shop#pantry-search" className="float-control" aria-label="Search pantry"><IconSearch /></Link>
            <Link href="/cart" className="float-control" aria-label="Cart"><IconCart /></Link>
            <button type="button" className="float-control" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
              <IconMenu open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      <div className={`menu-scrim ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`menu-panel ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="flex items-center justify-between">
          <img src="/branding/glided-wordmark.webp" alt="The Glided Pantry" className="w-56" />
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
