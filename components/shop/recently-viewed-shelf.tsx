"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceCents: number | null;
};

const KEY = "glided-pantry-recently-viewed";

export function RecentlyViewedShelf() {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      if (Array.isArray(stored)) setItems(stored.slice(0, 6));
    } catch {
      setItems([]);
    }
  }, []);

  if (!items.length) return null;

  return (
    <section className="pantry-recently-viewed">
      <div className="pantry-recently-viewed-head">
        <div>
          <span>Pick up where you left off</span>
          <h2>Recently viewed</h2>
        </div>
      </div>

      <div className="pantry-recently-viewed-grid">
        {items.map((item) => (
          <Link href={`/spices/${item.slug}`} key={item.id}>
            <div className="pantry-recently-viewed-image">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : null}
            </div>
            <div>
              <strong>{item.name}</strong>
              <span>
                {item.priceCents !== null
                  ? `From R${(item.priceCents / 100).toFixed(2)}`
                  : "View product"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
