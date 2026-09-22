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
  provider: "courier_guy";
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
  const [deliveryMode, setDeliveryMode] = useState<"door" | "locker">("door");
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
      if (!response.ok) {
        throw new Error(payload.error || "Could not load Courier Guy lockers.");
      }
      setLockers(payload.lockers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Courier Guy lockers.");
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

    if (deliveryMode === "door" && (!streetAddress || !city || !postalCode || !province)) {
      setError("Enter the delivery address above before requesting Courier Guy rates.");
      return;
    }

    if (deliveryMode === "locker" && !lockerCode) {
      setError("Choose a Courier Guy locker before requesting rates.");
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
          deliveryMode === "locker"
            ? {
                deliveryMode,
                deliveryLockerCode: lockerCode,
              }
            : {
                deliveryMode,
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
      if (!response.ok) {
        throw new Error(payload.error || "Could not load Courier Guy rates.");
      }

      setQuotes(payload.quotes ?? []);
      if (!(payload.quotes ?? []).length) {
        setError("No live Courier Guy rates were returned for this basket and destination.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Courier Guy rates.");
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
    setServiceLevelCode(quote.serviceLevelCode);
  }

  return (
    <div className="live-shipping-picker">
      <input type="hidden" name="shippingChoiceType" value={choiceType} />
      <input type="hidden" name="shippingMethodId" value={shippingMethodId} />
      <input type="hidden" name="shippingProvider" value={choiceType === "live" ? "courier_guy" : ""} />
      <input type="hidden" name="shippingDeliveryMode" value={choiceType === "live" ? deliveryMode : ""} />
      <input type="hidden" name="shippingServiceLevelCode" value={serviceLevelCode} />
      <input
        type="hidden"
        name="shippingLockerCode"
        value={choiceType === "live" && deliveryMode === "locker" ? lockerCode : ""}
      />

      <div className="live-shipping-tabs">
        <button
          type="button"
          className={deliveryMode === "door" ? "is-active" : ""}
          onClick={() => {
            setDeliveryMode("door");
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
          className={deliveryMode === "locker" ? "is-active" : ""}
          onClick={() => {
            setDeliveryMode("locker");
            setQuotes([]);
            setChoiceType("");
            setServiceLevelCode("");
            void loadLockers();
          }}
        >
          Locker delivery
          <small>The Courier Guy locker network</small>
        </button>
      </div>

      {deliveryMode === "locker" ? (
        <div className="live-locker-picker">
          <input
            type="search"
            value={lockerSearch}
            onChange={(event) => setLockerSearch(event.target.value)}
            onFocus={() => void loadLockers()}
            placeholder={lockerLoading ? "Loading lockers…" : "Search Courier Guy locker"}
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
            <option value="">Choose a Courier Guy locker</option>
            {filteredLockers.map((locker) => (
              <option key={locker.code} value={locker.code}>
                {locker.name} · {locker.code}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void getLiveQuotes()}
        className="live-rate-button"
        disabled={loading}
      >
        {loading ? "Checking live rates…" : "Get Courier Guy rates"}
      </button>

      {error ? <p className="live-shipping-error">{error}</p> : null}

      {quotes.length ? (
        <div className="live-rate-list">
          {quotes.map((quote) => (
            <button
              key={quote.serviceLevelCode}
              type="button"
              onClick={() => selectQuote(quote)}
              className={choiceType === "live" && serviceLevelCode === quote.serviceLevelCode ? "is-selected" : ""}
            >
              <span>
                <strong>{quote.serviceName}</strong>
                <small>{deliveryMode === "locker" ? "Courier Guy locker" : "Courier Guy door delivery"}</small>
              </span>
              <b>R{(quote.rateCents / 100).toFixed(2)}</b>
            </button>
          ))}
        </div>
      ) : null}

      {collectionMethods.length ? (
        <div className="collection-options">
          <span>Or collect from us</span>
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
        Door and locker rates both come from The Courier Guy. The selected rate is checked again before payment.
      </p>
    </div>
  );
}
