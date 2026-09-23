"use client";

import { useEffect } from "react";

const KEY = "glided-pantry-recently-viewed";

export function RecentlyViewedTracker({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    priceCents: number | null;
  };
}) {
  useEffect(() => {
    try {
      const existing = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      const next = [
        product,
        ...(Array.isArray(existing) ? existing : []).filter(
          (item: { id?: string }) => item?.id !== product.id,
        ),
      ].slice(0, 8);

      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Ignore storage restrictions.
    }
  }, [product]);

  return null;
}
