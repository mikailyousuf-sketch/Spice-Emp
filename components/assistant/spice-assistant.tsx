"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { addToCart } from "@/app/cart/actions";

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
  score: number;
};

type AssistantResponse = {
  query: string;
  recommendations: Recommendation[];
  exactMatchFound: boolean;
  note: string;
};

const starters = [
  "I'm making chicken curry",
  "Something smoky for steak",
  "Warm spices for roast vegetables",
  "A mild spice for rice",
];

export function SpiceAssistant() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAssistant(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
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
              void runAssistant(starter);
            }}
          >
            {starter}
          </button>
        ))}
      </div>

      {error ? <p className="assistant-error">{error}</p> : null}

      {result ? (
        <section className="assistant-results" aria-live="polite">
          <div className="assistant-results-head">
            <div>
              <span>{result.exactMatchFound ? "Pantry matches" : "Available now"}</span>
              <h2>{result.exactMatchFound ? "These fit what you're cooking." : "The catalogue is still growing."}</h2>
            </div>
            <p>{result.note}</p>
          </div>

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
                      <form action={addToCart} className="assistant-cart-form">
                        <input type="hidden" name="variantId" value={product.variantId} />
                        <input type="hidden" name="quantity" value="1" />
                        <button type="submit" className="assistant-add-button">
                          <span>Add {product.variantLabel ?? "to cart"}</span>
                          <strong>
                            {product.priceCents !== null
                              ? `R${(product.priceCents / 100).toFixed(2)}`
                              : "Add to cart"}
                          </strong>
                          <i aria-hidden="true">＋</i>
                        </button>
                      </form>
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
            <span>How it works</span>
            <p>
              The assistant suggests real products from the live pantry based on what you describe.
              Choose what sounds right and add it straight to your cart.
            </p>
          </div>
        </section>
      ) : (
        <div className="assistant-trust-row">
          <div><span>01</span><strong>Real products only</strong><p>No invented jars or availability.</p></div>
          <div><span>02</span><strong>Live catalogue</strong><p>Matches aliases, flavour, cuisine and use.</p></div>
          <div><span>03</span><strong>Shop instantly</strong><p>Add suggested spices straight to your cart.</p></div>
        </div>
      )}
    </div>
  );
}
