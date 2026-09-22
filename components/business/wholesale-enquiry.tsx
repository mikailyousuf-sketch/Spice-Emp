"use client";

import { useMemo, useState } from "react";
import { submitBusinessEnquiry } from "@/app/business/actions";

type ProductOption = {
  id: string;
  name: string;
};

type QuoteRow = {
  productId: string;
  quantityKg: number;
};

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

export function WholesaleEnquiry({ products }: { products: ProductOption[] }) {
  const [rows, setRows] = useState<QuoteRow[]>([
    { productId: products[0]?.id ?? "", quantityKg: 1 },
  ]);

  const validRows = useMemo(
    () => rows.filter((row) => row.productId && row.quantityKg > 0),
    [rows],
  );

  function updateRow(index: number, patch: Partial<QuoteRow>) {
    setRows((current) =>
      current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { productId: products.find((product) => !current.some((row) => row.productId === product.id))?.id ?? "", quantityKg: 1 },
    ]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <form action={submitBusinessEnquiry} className="business-form">
      <input type="hidden" name="itemsJson" value={JSON.stringify(validRows)} />

      <section className="business-form-card">
        <div className="business-form-heading">
          <span>01</span>
          <div>
            <p>Business details</p>
            <h2>Tell us about your kitchen.</h2>
          </div>
        </div>

        <div className="business-form-grid">
          <label>
            <span>Company / business name</span>
            <input name="companyName" required className="business-field" />
          </label>
          <label>
            <span>Business type</span>
            <select name="businessType" required defaultValue="" className="business-field">
              <option value="" disabled>Select business type</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Hotel / hospitality">Hotel / hospitality</option>
              <option value="Catering">Catering</option>
              <option value="Retailer">Retailer</option>
              <option value="Food manufacturer">Food manufacturer</option>
              <option value="Takeaway / dark kitchen">Takeaway / dark kitchen</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            <span>Registration number <small>optional</small></span>
            <input name="registrationNumber" className="business-field" />
          </label>
          <label>
            <span>VAT number <small>optional</small></span>
            <input name="vatNumber" className="business-field" />
          </label>
          <label>
            <span>Contact person</span>
            <input name="contactName" required className="business-field" />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" required className="business-field" />
          </label>
          <label>
            <span>Phone</span>
            <input name="phone" required className="business-field" />
          </label>
          <label>
            <span>City</span>
            <input name="city" required className="business-field" />
          </label>
          <label>
            <span>Province</span>
            <select name="province" required defaultValue="" className="business-field">
              <option value="" disabled>Select province</option>
              {provinces.map((province) => <option value={province} key={province}>{province}</option>)}
            </select>
          </label>
          <label>
            <span>Approx. monthly spice volume (kg)</span>
            <input name="monthlyVolumeKg" type="number" min="0" step="0.1" className="business-field" />
          </label>
          <label>
            <span>Ordering frequency</span>
            <select name="orderingFrequency" defaultValue="" className="business-field">
              <option value="">Not sure yet</option>
              <option value="Weekly">Weekly</option>
              <option value="Fortnightly">Fortnightly</option>
              <option value="Monthly">Monthly</option>
              <option value="Ad hoc">Ad hoc / as needed</option>
            </select>
          </label>
        </div>
      </section>

      <section className="business-form-card">
        <div className="business-form-heading">
          <span>02</span>
          <div>
            <p>Quote basket</p>
            <h2>What do you want priced?</h2>
          </div>
        </div>

        <div className="business-quote-list">
          {rows.map((row, index) => (
            <div className="business-quote-row" key={index}>
              <label>
                <span>Product</span>
                <select
                  value={row.productId}
                  onChange={(event) => updateRow(index, { productId: event.target.value })}
                  className="business-field"
                  required
                >
                  <option value="">Choose a spice</option>
                  {products.map((product) => (
                    <option value={product.id} key={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Approx. quantity</span>
                <div className="business-qty-field">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={row.quantityKg}
                    onChange={(event) => updateRow(index, { quantityKg: Number(event.target.value) })}
                    className="business-field"
                    required
                  />
                  <b>kg</b>
                </div>
              </label>
              {rows.length > 1 ? (
                <button type="button" onClick={() => removeRow(index)} className="business-remove-row">
                  Remove
                </button>
              ) : <span />}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= Math.min(12, Math.max(1, products.length))}
          className="business-add-row"
        >
          + Add another spice
        </button>
      </section>

      <section className="business-form-card">
        <div className="business-form-heading">
          <span>03</span>
          <div>
            <p>Anything else?</p>
            <h2>Tell us what matters.</h2>
          </div>
        </div>

        <label className="business-notes">
          <span>Notes, pack sizes, blends or recurring-order requirements</span>
          <textarea
            name="notes"
            rows={6}
            maxLength={3000}
            className="business-field"
            placeholder="For example: 5kg food-service bags, custom blend interest, delivery twice per month..."
          />
        </label>

        <div className="business-submit-row">
          <div>
            <strong>No payment is taken here.</strong>
            <p>We review the request and contact you with wholesale pricing and availability.</p>
          </div>
          <button type="submit" disabled={!validRows.length}>Request wholesale quote ↗</button>
        </div>
      </section>
    </form>
  );
}
