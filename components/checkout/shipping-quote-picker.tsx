"use client";

import { useMemo, useState } from "react";

type CollectionMethod = {
  id: string;
  name: string;
  description: string | null;
  fee_cents: number;
  free_above_cents: number | null;
};

type Quote = {
  provider: "courier_guy" | "pudo";
  serviceLevelCode: string;
  serviceName: string;
  rateCents: number;
};

type Locker = {
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export function ShippingQuotePicker({
  collectionMethods,
  subtotalCents,
}: {
  collectionMethods: CollectionMethod[];
  subtotalCents: number;
}) {
  const [choiceType, setChoiceType] = useState<"manual" | "live" | "">("");
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [provider, setProvider] = useState<"courier_guy" | "pudo">("courier_guy");
  const [serviceLevelCode, setServiceLevelCode] = useState("");
  const [lockerCode, setLockerCode] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [lockerSearch, setLockerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockerLoading, setLockerLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredLockers = useMemo(() => {
    const q = lockerSearch.trim().toLowerCase();
    const list = q
      ? lockers.filter((locker) =>
          locker.name.toLowerCase().includes(q) || locker.code.toLowerCase().includes(q),
        )
      : lockers;
    return list.slice(0, 80);
  }, [lockers, lockerSearch]);

  function getCheckoutForm() {
    return document.querySelector<HTMLFormElement>("#checkout-form");
  }

  async function loadLockers() {
    if (lockers.length) return;
    setLockerLoading(true);
    setError("");
    try {
      const response = await fetch("/api/shipping/lockers", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load PUDO lockers.");
      setLockers(payload.lockers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load PUDO lockers.");
    } finally {
      setLockerLoading(false);
    }
  }

  async function getLiveQuotes() {
    const form = getCheckoutForm();
    if (!form) return;

    const data = new FormData(form);
    const streetAddress = String(data.get("line1") || "").trim();
    const suburb = String(data.get("suburb") || "").trim();
    const city = String(data.get("city") || "").trim();
    const postalCode = String(data.get("postalCode") || "").trim();
    const province = String(data.get("province") || "").trim();

    if (provider === "courier_guy" && (!streetAddress || !city || !postalCode || !province)) {
      setError("Enter the delivery address above before requesting Courier Guy rates.");
      return;
    }

    if (provider === "pudo" && !lockerCode) {
      setError("Choose a PUDO locker before requesting rates.");
      return;
    }

    setLoading(true);
    setError("");
    setQuotes([]);
    setServiceLevelCode("");
    setChoiceType("");

    try {
      const response = await fetch("/api/shipping/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          provider === "pudo"
            ? { provider, deliveryLockerCode: lockerCode }
            : {
                provider,
                deliveryAddress: {
                  streetAddress,
                  suburb,
                  localArea: suburb,
                  city,
                  postalCode,
                  province,
                },
              },
        ),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load courier rates.");

      setQuotes(payload.quotes ?? []);
      if (!(payload.quotes ?? []).length) {
        setError("No live courier rates were returned for this basket and destination.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courier rates.");
    } finally {
      setLoading(false);
    }
  }

  function selectCollection(id: string) {
    setChoiceType("manual");
    setShippingMethodId(id);
    setServiceLevelCode("");
    setQuotes([]);
  }

  function selectQuote(quote: Quote) {
    setChoiceType("live");
    setShippingMethodId("");
    setProvider(quote.provider);
    setServiceLevelCode(quote.serviceLevelCode);
  }

  return (
    <div className="live-shipping-picker">
      <input type="hidden" name="shippingChoiceType" value={choiceType} />
      <input type="hidden" name="shippingMethodId" value={shippingMethodId} />
      <input type="hidden" name="shippingProvider" value={choiceType === "live" ? provider : ""} />
      <input type="hidden" name="shippingServiceLevelCode" value={serviceLevelCode} />
      <input type="hidden" name="shippingLockerCode" value={choiceType === "live" && provider === "pudo" ? lockerCode : ""} />

      <div className="live-shipping-tabs">
        <button
          type="button"
          className={provider === "courier_guy" ? "is-active" : ""}
          onClick={() => {
            setProvider("courier_guy");
            setQuotes([]);
            setChoiceType("");
            setServiceLevelCode("");
          }}
        >
          Door delivery
          <small>The Courier Guy</small>
        </button>
        <button
          type="button"
          className={provider === "pudo" ? "is-active" : ""}
          onClick={() => {
            setProvider("pudo");
            setQuotes([]);
            setChoiceType("");
            setServiceLevelCode("");
            void loadLockers();
          }}
        >
          Locker delivery
          <small>PUDO</small>
        </button>
      </div>

      {provider === "pudo" ? (
        <div className="live-locker-picker">
          <input
            type="search"
            value={lockerSearch}
            onChange={(event) => setLockerSearch(event.target.value)}
            onFocus={() => void loadLockers()}
            placeholder={lockerLoading ? "Loading lockers…" : "Search locker by name or code"}
            className="field"
          />
          <select
            value={lockerCode}
            onChange={(event) => {
              setLockerCode(event.target.value);
              setQuotes([]);
              setChoiceType("");
            }}
            className="field"
            disabled={lockerLoading}
          >
            <option value="">Choose a PUDO locker</option>
            {filteredLockers.map((locker) => (
              <option key={locker.code} value={locker.code}>
                {locker.name} · {locker.code}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button type="button" onClick={() => void getLiveQuotes()} className="live-rate-button" disabled={loading}>
        {loading ? "Checking live rates…" : "Get live courier rates"}
      </button>

      {error ? <p className="live-shipping-error">{error}</p> : null}

      {quotes.length ? (
        <div className="live-rate-list">
          {quotes.map((quote) => (
            <button
              key={quote.provider + quote.serviceLevelCode}
              type="button"
              onClick={() => selectQuote(quote)}
              className={choiceType === "live" && serviceLevelCode === quote.serviceLevelCode ? "is-selected" : ""}
            >
              <span>
                <strong>{quote.serviceName}</strong>
                <small>{quote.provider === "pudo" ? "PUDO locker" : "The Courier Guy"}</small>
              </span>
              <b>R{(quote.rateCents / 100).toFixed(2)}</b>
            </button>
          ))}
        </div>
      ) : null}

      {collectionMethods.length ? (
        <div className="collection-options">
          <span>Or collect</span>
          {collectionMethods.map((method) => {
            const fee =
              method.free_above_cents != null && subtotalCents >= method.free_above_cents
                ? 0
                : method.fee_cents;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => selectCollection(method.id)}
                className={choiceType === "manual" && shippingMethodId === method.id ? "is-selected" : ""}
              >
                <span>
                  <strong>{method.name}</strong>
                  <small>{method.description || "Collection"}</small>
                </span>
                <b>{fee === 0 ? "Free" : "R" + (fee / 100).toFixed(2)}</b>
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="live-shipping-note">
        Live rates are calculated from your basket weight and dimensions. The selected rate is checked again before payment.
      </p>
    </div>
  );
}
