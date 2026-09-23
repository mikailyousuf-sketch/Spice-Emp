"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Option = { id: string; name: string };

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heatLevel: number;
  imageUrl: string | null;
  imageAlt: string;
  priceCents: number | null;
  variantLabel: string | null;
};

type Props = {
  values: {
    q?: string;
    type?: string;
    cuisine?: string;
    food?: string;
    flavour?: string;
    method?: string;
    heat?: string;
  };
  types: Option[];
  cuisines: Option[];
  foodTypes: Option[];
  flavours: Option[];
  cookingMethods: Option[];
  trending?: string[];
};

const RECENT_SEARCH_KEY = "glided-pantry-recent-searches";

export function FloatingFilterBar({
  values,
  types,
  cuisines,
  foodTypes,
  flavours,
  cookingMethods,
  trending = [],
}: Props) {
  const [open, setOpen] = useState(Boolean(
    values.q || values.type || values.cuisine || values.food || values.flavour || values.method || values.heat,
  ));
  const [query, setQuery] = useState(values.q ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) || "[]");
      if (Array.isArray(stored)) setRecent(stored.slice(0, 6));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (response.ok) setResults(payload.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const discoveryTerms = useMemo(
    () => Array.from(new Set([...trending, ...recent])).slice(0, 8),
    [trending, recent],
  );

  function rememberSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    const next = [
      trimmed,
      ...recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 6);

    setRecent(next);
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    rememberSearch(query);
  }

  return (
    <div className="pantry-filter-shell mx-auto mt-10 max-w-6xl">
      <div className="pantry-filter-card">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="pantry-filter-trigger"
          aria-expanded={open}
        >
          <span className="pantry-filter-icon" aria-hidden="true">⌕</span>
          <span className="min-w-0 flex-1">
            <span className="pantry-filter-kicker">Search spices, cuisines or dishes</span>
            <span className="pantry-filter-value">
              {values.q || "Search the pantry"}
            </span>
          </span>
          <span className="pantry-filter-toggle">
            {open ? "Close ↑" : "Filters ↓"}
          </span>
        </button>

        {open ? (
          <form className="pantry-filter-form" onSubmit={submit}>
            <div className="pantry-live-search-wrap">
              <input
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search turmeric, dhana, braai blends..."
                className="pantry-field pantry-field-search"
                autoFocus
                autoComplete="off"
              />

              {query.trim().length >= 2 ? (
                <div className="pantry-live-search">
                  <div className="pantry-live-search-head">
                    <span>{loading ? "Searching…" : results.length ? "Best matches" : "No close match yet"}</span>
                    <Link href={`/shop?q=${encodeURIComponent(query.trim())}`} onClick={() => rememberSearch(query)}>
                      See all →
                    </Link>
                  </div>

                  {results.length ? (
                    <div className="pantry-live-search-results">
                      {results.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          href={`/spices/${item.slug}`}
                          onClick={() => rememberSearch(query)}
                        >
                          <div className="pantry-live-search-image">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt} /> : null}
                          </div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {item.variantLabel ? `${item.variantLabel} · ` : ""}
                              {item.priceCents !== null ? `R${(item.priceCents / 100).toFixed(2)}` : "Out of stock"}
                            </span>
                          </div>
                          <span>↗</span>
                        </Link>
                      ))}
                    </div>
                  ) : !loading ? (
                    <p className="pantry-live-search-empty">
                      Try a cuisine, dish, local name or similar spelling.
                    </p>
                  ) : null}
                </div>
              ) : discoveryTerms.length ? (
                <div className="pantry-discovery-terms">
                  <span>Discover</span>
                  <div>
                    {discoveryTerms.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pantry-filter-grid">
              <Filter name="type" value={values.type} label="🫙 Product type" options={types} />
              <Filter name="cuisine" value={values.cuisine} label="🌍 Cuisine" options={cuisines} />
              <Filter name="food" value={values.food} label="🍛 Dish / food" options={foodTypes} />
              <Filter name="flavour" value={values.flavour} label="✨ Flavour" options={flavours} />
              <Filter name="method" value={values.method} label="🔥 Cooking method" options={cookingMethods} />
              <select name="heat" defaultValue={values.heat ?? ""} className="pantry-field">
                <option value="">🌶 Heat level</option>
                {[0,1,2,3,4,5].map(level => <option key={level} value={level}>Heat {level}/5</option>)}
              </select>
            </div>

            <div className="pantry-filter-actions">
              <a href="/shop" className="pantry-filter-clear">Clear</a>
              <button type="submit" className="pantry-filter-submit">Search pantry →</button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function Filter({
  name,
  value,
  label,
  options,
}: {
  name: string;
  value?: string;
  label: string;
  options: Option[];
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className="pantry-field">
      <option value="">{label}</option>
      {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  );
}
