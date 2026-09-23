"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Recommendation = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heatLevel: number;
  imageUrl: string | null;
  imageAlt: string;
  priceCents: number | null;
  variantId: string | null;
  variantLabel: string | null;
  inStock: boolean;
  matched: string[];
  why: string;
  score: number;
};

type RefinementOption = {
  key: "mild" | "hot" | "meat" | "vegetarian";
  label: string;
};

type Refinements = {
  heat?: "mild" | "medium" | "hot";
  diet?: "meat" | "vegetarian";
};

type AssistantResponse = {
  query: string;
  recommendations: Recommendation[];
  exactMatchFound: boolean;
  note: string;
  refinements: RefinementOption[];
};

const starters = [
  "I'm making chicken curry",
  "Something smoky for steak",
  "Warm spices for roast vegetables",
  "A mild spice for rice",
];

const SESSION_KEY = "glided-pantry-assistant-prompt";

export function SpiceAssistant() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [refinements, setRefinements] = useState<Refinements>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | "all" | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SESSION_KEY);
    if (saved) setQuery(saved);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      window.sessionStorage.setItem(SESSION_KEY, query);
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  }, [query]);

  const availableRecommendations = useMemo(
    () => (result?.recommendations ?? []).filter((item) => item.inStock && item.variantId),
    [result],
  );

  async function runAssistant(value: string, nextRefinements: Refinements = refinements) {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          refinements: nextRefinements,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The pantry could not be searched.");
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The pantry could not be searched.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAssistant(query);
  }

  async function applyRefinement(key: RefinementOption["key"]) {
    const next: Refinements = { ...refinements };

    if (key === "mild") next.heat = "mild";
    if (key === "hot") next.heat = "hot";
    if (key === "meat") next.diet = "meat";
    if (key === "vegetarian") next.diet = "vegetarian";

    setRefinements(next);
    await runAssistant(query, next);
  }

  async function addVariants(variantIds: string[], target: string | "all") {
    if (!variantIds.length) return;

    setAdding(target);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/cart/add-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The pantry could not update your cart.");
      }

      window.dispatchEvent(
        new CustomEvent("pantry:cart-add", {
          detail: { quantity: Number(payload.added) || variantIds.length },
        }),
      );

      setNotice(
        payload.added === 1
          ? "1 suggested spice added to your cart."
          : `${payload.added} suggested spices added to your cart.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The pantry could not update your cart.");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="assistant-experience">
      <form onSubmit={submit} className="assistant-console">
        <div className="assistant-console-head">
          <span className="assistant-orb" aria-hidden="true">✦</span>
          <div>
            <span>Pantry intelligence</span>
            <strong>What are you cooking?</strong>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Try: I'm making lamb curry for dinner and want it warm, aromatic and not too hot..."
          className="assistant-input"
        />

        {Object.keys(refinements).length ? (
          <div className="assistant-active-refinements">
            {refinements.heat ? <span>Heat · {refinements.heat}</span> : null}
            {refinements.diet ? <span>Dish · {refinements.diet}</span> : null}
            <button
              type="button"
              onClick={() => {
                setRefinements({});
                void runAssistant(query, {});
              }}
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="assistant-console-footer">
          <p>Recommendations are restricted to live catalogue products.</p>
          <button type="submit" disabled={loading || query.trim().length < 2}>
            {loading ? "Searching pantry…" : "Find my spices"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>

      <div className="assistant-starters" aria-label="Example prompts">
        {starters.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => {
              setQuery(starter);
              setRefinements({});
              void runAssistant(starter, {});
            }}
          >
            {starter}
          </button>
        ))}
      </div>

      {error ? <p className="assistant-error">{error}</p> : null}
      {notice ? <p className="assistant-success">{notice}</p> : null}

      {result ? (
        <section className="assistant-results" aria-live="polite">
          <div className="assistant-results-head">
            <div>
              <span>{result.exactMatchFound ? "Pantry matches" : "Demand signal captured"}</span>
              <h2>
                {result.exactMatchFound
                  ? "These fit what you're cooking."
                  : "We don't have a strong match yet."}
              </h2>
            </div>
            <p>{result.note}</p>
          </div>

          <div className="assistant-refinement-row">
            <span>Refine this search</span>
            <div>
              {result.refinements.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  onClick={() => void applyRefinement(option.key)}
                  disabled={loading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {availableRecommendations.length > 1 ? (
            <div className="assistant-bundle-bar">
              <div>
                <span>Build the set</span>
                <strong>Add every available suggestion in one click.</strong>
              </div>
              <button
                type="button"
                disabled={adding !== null}
                onClick={() =>
                  void addVariants(
                    availableRecommendations.flatMap((item) =>
                      item.variantId ? [item.variantId] : [],
                    ),
                    "all",
                  )
                }
              >
                {adding === "all"
                  ? "Adding set…"
                  : `Add all ${availableRecommendations.length} to cart +`}
              </button>
            </div>
          ) : null}

          {result.recommendations.length ? (
            <div className="assistant-result-grid">
              {result.recommendations.map((product, index) => (
                <article className="assistant-result-card" key={product.id}>
                  <Link href={`/spices/${product.slug}`} className="assistant-result-visual">
                    <span className="assistant-result-number">0{index + 1}</span>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.imageAlt} />
                    ) : (
                      <div className="assistant-result-placeholder">
                        <img src="/branding/glided-monogram.svg" alt="" />
                      </div>
                    )}
                  </Link>

                  <div className="assistant-result-copy">
                    <div>
                      <span>{product.inStock ? "In pantry" : "Currently unavailable"}</span>
                      <h3><Link href={`/spices/${product.slug}`}>{product.name}</Link></h3>
                    </div>

                    {product.priceCents !== null ? (
                      <strong>From R{(product.priceCents / 100).toFixed(2)}</strong>
                    ) : null}

                    {product.description ? <p>{product.description}</p> : null}

                    <div className="assistant-why">
                      <span>Why this spice</span>
                      <p>{product.why}</p>
                    </div>

                    {product.matched.length ? (
                      <div className="assistant-match-tags">
                        {product.matched.map((match) => <span key={match}>{match}</span>)}
                      </div>
                    ) : null}

                    <div className="assistant-card-footer">
                      <span>Heat {product.heatLevel}/5</span>
                      <Link href={`/spices/${product.slug}`}>View spice →</Link>
                    </div>

                    {product.variantId && product.inStock ? (
                      <button
                        type="button"
                        className="assistant-add-button"
                        disabled={adding !== null}
                        onClick={() => void addVariants([product.variantId!], product.id)}
                      >
                        <span>
                          {adding === product.id
                            ? "Adding…"
                            : `Add ${product.variantLabel ?? "to cart"}`}
                        </span>
                        <strong>
                          {product.priceCents !== null
                            ? `R${(product.priceCents / 100).toFixed(2)}`
                            : "Add to cart"}
                        </strong>
                        <i aria-hidden="true">＋</i>
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="assistant-no-results">
              No live catalogue products are available yet.
            </div>
          )}

          <div className="assistant-grounding-note">
            <span>Grounded pantry intelligence</span>
            <p>
              Recommendations come from real live products, stock and catalogue
              classifications. Searches with weak matches are logged so the pantry
              can learn what customers want stocked next.
            </p>
          </div>
        </section>
      ) : (
        <div className="assistant-trust-row">
          <div><span>01</span><strong>Real products only</strong><p>No invented jars or availability.</p></div>
          <div><span>02</span><strong>Refine the answer</strong><p>Adjust heat and dish style without starting over.</p></div>
          <div><span>03</span><strong>Shop instantly</strong><p>Add one suggestion or the full set without leaving the assistant.</p></div>
        </div>
      )}
    </div>
  );
}
