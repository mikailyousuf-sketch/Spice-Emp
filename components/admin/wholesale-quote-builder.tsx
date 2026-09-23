"use client";

import { useMemo, useState } from "react";

type Line = {
  productId: string;
  productName: string;
  quantityKg: number;
  unitPriceCentsPerKg: number;
};

export function WholesaleQuoteBuilder({
  initialLines,
  existingQuote,
}: {
  initialLines: Line[];
  existingQuote?: {
    id: string;
    validUntil: string | null;
    customerNotes: string | null;
    adminNotes: string | null;
    shippingCents: number;
    discountCents: number;
    taxCents: number;
  } | null;
}) {
  const [lines, setLines] = useState(initialLines);
  const [shippingCents, setShippingCents] = useState(existingQuote?.shippingCents ?? 0);
  const [discountCents, setDiscountCents] = useState(existingQuote?.discountCents ?? 0);
  const [taxCents, setTaxCents] = useState(existingQuote?.taxCents ?? 0);

  const subtotal = useMemo(
    () => lines.reduce(
      (sum, line) => sum + Math.round(line.quantityKg * line.unitPriceCentsPerKg),
      0,
    ),
    [lines],
  );

  const total = Math.max(0, subtotal - discountCents + shippingCents + taxCents);

  function patchLine(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  return (
    <div className="wholesale-quote-builder">
      <input type="hidden" name="quoteId" value={existingQuote?.id ?? ""} />
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <div className="wholesale-quote-lines">
        {lines.map((line, index) => {
          const lineTotal = Math.round(line.quantityKg * line.unitPriceCentsPerKg);

          return (
            <div className="wholesale-quote-line" key={line.productId + index}>
              <div>
                <span>Product</span>
                <strong>{line.productName}</strong>
              </div>

              <label>
                <span>Quantity kg</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={line.quantityKg}
                  onChange={(event) =>
                    patchLine(index, {
                      quantityKg: Math.max(0.001, Number(event.target.value) || 0.001),
                    })
                  }
                  className="field"
                />
              </label>

              <label>
                <span>Price / kg</span>
                <div className="wholesale-money-input">
                  <i>R</i>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(line.unitPriceCentsPerKg / 100).toFixed(2)}
                    onChange={(event) =>
                      patchLine(index, {
                        unitPriceCentsPerKg: Math.max(
                          0,
                          Math.round((Number(event.target.value) || 0) * 100),
                        ),
                      })
                    }
                    className="field"
                  />
                </div>
              </label>

              <div className="wholesale-line-total">
                <span>Line total</span>
                <strong>R{(lineTotal / 100).toFixed(2)}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="wholesale-quote-adjustments">
        <label>
          <span>Discount</span>
          <div className="wholesale-money-input">
            <i>R</i>
            <input
              type="number"
              name="discountRands"
              min="0"
              step="0.01"
              value={(discountCents / 100).toFixed(2)}
              onChange={(event) =>
                setDiscountCents(Math.max(0, Math.round((Number(event.target.value) || 0) * 100)))
              }
              className="field"
            />
          </div>
        </label>

        <label>
          <span>Shipping</span>
          <div className="wholesale-money-input">
            <i>R</i>
            <input
              type="number"
              min="0"
              step="0.01"
              value={(shippingCents / 100).toFixed(2)}
              onChange={(event) =>
                setShippingCents(Math.max(0, Math.round((Number(event.target.value) || 0) * 100)))
              }
              className="field"
            />
          </div>
        </label>

        <label>
          <span>Tax</span>
          <div className="wholesale-money-input">
            <i>R</i>
            <input
              type="number"
              min="0"
              step="0.01"
              value={(taxCents / 100).toFixed(2)}
              onChange={(event) =>
                setTaxCents(Math.max(0, Math.round((Number(event.target.value) || 0) * 100)))
              }
              className="field"
            />
          </div>
        </label>
      </div>

      <input type="hidden" name="discountCents" value={discountCents} />
      <input type="hidden" name="shippingCents" value={shippingCents} />
      <input type="hidden" name="taxCents" value={taxCents} />

      <div className="wholesale-quote-total-box">
        <div><span>Subtotal</span><strong>R{(subtotal / 100).toFixed(2)}</strong></div>
        {discountCents ? <div><span>Discount</span><strong>-R{(discountCents / 100).toFixed(2)}</strong></div> : null}
        {shippingCents ? <div><span>Shipping</span><strong>R{(shippingCents / 100).toFixed(2)}</strong></div> : null}
        {taxCents ? <div><span>Tax</span><strong>R{(taxCents / 100).toFixed(2)}</strong></div> : null}
        <div className="is-total"><span>Quote total</span><strong>R{(total / 100).toFixed(2)}</strong></div>
      </div>

      <div className="wholesale-quote-meta">
        <label>
          <span>Valid until</span>
          <input
            type="date"
            name="validUntil"
            defaultValue={existingQuote?.validUntil ?? ""}
            className="field"
          />
        </label>

        <label>
          <span>Customer-facing note</span>
          <textarea
            name="customerNotes"
            rows={4}
            defaultValue={existingQuote?.customerNotes ?? ""}
            placeholder="Lead time, packaging, MOQ, payment terms…"
            className="field resize-y"
          />
        </label>

        <label>
          <span>Internal quote notes</span>
          <textarea
            name="quoteAdminNotes"
            rows={4}
            defaultValue={existingQuote?.adminNotes ?? ""}
            placeholder="Margin notes, supplier checks, negotiation context…"
            className="field resize-y"
          />
        </label>
      </div>
    </div>
  );
}
