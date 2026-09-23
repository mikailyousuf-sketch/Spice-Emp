"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ShippingSelection = {
  id: string;
  code: string;
  name: string;
  feeCents: number;
  detail?: string;
};

export function CheckoutControls({ subtotalCents }: { subtotalCents: number }) {
  const [shipping, setShipping] = useState<ShippingSelection | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hiddenSubmitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onShipping = (event: Event) => {
      const detail = (event as CustomEvent<ShippingSelection>).detail;
      if (detail?.id) setShipping(detail);
    };

    window.addEventListener("pantry:shipping-selection", onShipping as EventListener);
    return () => window.removeEventListener("pantry:shipping-selection", onShipping as EventListener);
  }, []);

  const totalCents = subtotalCents + (shipping?.feeCents ?? 0);

  function openReview() {
    const form = document.getElementById("checkout-form") as HTMLFormElement | null;
    if (!form) return;

    if (!form.reportValidity()) return;

    const shippingMethodId = new FormData(form).get("shippingMethodId");
    if (!shippingMethodId) {
      document.getElementById("checkout-shipping")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setReviewOpen(true);
  }

  function confirmPayment() {
    if (submitting) return;
    setSubmitting(true);
    setReviewOpen(false);

    window.setTimeout(() => {
      hiddenSubmitRef.current?.click();
    }, 0);
  }

  return (
    <>
      <div className="checkout-live-totals">
        <div>
          <span>Subtotal</span>
          <strong>R{(subtotalCents / 100).toFixed(2)}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>
            {shipping
              ? `R${(shipping.feeCents / 100).toFixed(2)}`
              : "Select delivery"}
          </strong>
        </div>
        <div className="checkout-live-total">
          <span>Total</span>
          <strong>
            {shipping
              ? `R${(totalCents / 100).toFixed(2)}`
              : `R${(subtotalCents / 100).toFixed(2)}+`}
          </strong>
        </div>
      </div>

      {shipping ? (
        <div className="checkout-selected-delivery">
          <span>Delivery selected</span>
          <strong>{shipping.name}</strong>
          {shipping.detail ? <p>{shipping.detail}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        className="btn-primary mt-6 w-full"
        onClick={openReview}
        disabled={submitting}
      >
        {submitting ? "Opening secure payment…" : "Review order"}
      </button>

      <button
        ref={hiddenSubmitRef}
        type="submit"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        Submit order
      </button>

      <Link href="/cart" className="btn-secondary mt-3 w-full">
        Back to cart
      </Link>

      <p className="checkout-secure-note">
        Payment is completed securely with your selected payment provider.
        Your order is only confirmed after payment succeeds.
      </p>

      {reviewOpen ? (
        <div className="checkout-review-backdrop" role="presentation">
          <section
            className="checkout-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-review-title"
          >
            <div className="checkout-review-top">
              <div>
                <span>Final check</span>
                <h2 id="checkout-review-title">Review before payment</h2>
              </div>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                aria-label="Close review"
              >
                ×
              </button>
            </div>

            <div className="checkout-review-lines">
              <div>
                <span>Products</span>
                <strong>R{(subtotalCents / 100).toFixed(2)}</strong>
              </div>
              <div>
                <span>{shipping?.name ?? "Delivery"}</span>
                <strong>R{((shipping?.feeCents ?? 0) / 100).toFixed(2)}</strong>
              </div>
              <div className="is-total">
                <span>Total to pay</span>
                <strong>R{(totalCents / 100).toFixed(2)}</strong>
              </div>
            </div>

            <div className="checkout-review-delivery">
              <span>Delivery</span>
              <strong>{shipping?.name}</strong>
              {shipping?.detail ? <p>{shipping.detail}</p> : null}
            </div>

            <p className="checkout-review-copy">
              Check your contact details, delivery address and delivery method above.
              Continuing will create the order and take you to secure payment.
            </p>

            <div className="checkout-review-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReviewOpen(false)}
                disabled={submitting}
              >
                Go back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmPayment}
                disabled={submitting}
              >
                {submitting ? "Opening payment…" : `Pay R${(totalCents / 100).toFixed(2)}`}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
