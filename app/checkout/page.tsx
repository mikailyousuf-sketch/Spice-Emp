import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartSnapshot } from "@/lib/cart";
import { createOrder } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Checkout" };

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

export default async function CheckoutPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const cart = await getCartSnapshot();

  if (!cart?.items?.length) {
    redirect("/cart");
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants;

    if (!variant) return sum;
    return sum + Math.round(Number(item.quantity) * variant.retail_price_cents);
  }, 0);

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Checkout</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
          Delivery details
        </h1>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
            {error}
          </p>
        ) : null}

        <form action={createOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="glass-soft grid gap-5 rounded-[2rem] p-6 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="First name"><input name="firstName" required className="field" /></Field>
              <Field label="Last name"><input name="lastName" required className="field" /></Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Email"><input name="email" type="email" required className="field" /></Field>
              <Field label="Phone"><input name="phone" required className="field" /></Field>
            </div>

            <Field label="Company (optional)"><input name="company" className="field" /></Field>
            <Field label="Street address"><input name="line1" required className="field" /></Field>
            <Field label="Apartment / unit / building (optional)"><input name="line2" className="field" /></Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Suburb"><input name="suburb" className="field" /></Field>
              <Field label="City"><input name="city" required className="field" /></Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Province">
                <select name="province" required defaultValue="" className="field">
                  <option value="" disabled>Select province</option>
                  {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
                </select>
              </Field>
              <Field label="Postal code"><input name="postalCode" required className="field" /></Field>
            </div>

            <Field label="Order notes (optional)">
              <textarea name="notes" rows={4} className="field resize-y" />
            </Field>
          </div>

          <aside className="glass h-fit rounded-[2rem] p-6">
            <p className="display-font text-2xl font-semibold">Order summary</p>
            <div className="mt-6 grid gap-3 text-sm">
              {cart.items.map((item) => {
                const variant = Array.isArray(item.product_variants)
                  ? item.product_variants[0]
                  : item.product_variants;
                const product = Array.isArray(variant?.products)
                  ? variant?.products[0]
                  : variant?.products;

                if (!variant || !product) return null;

                return (
                  <div key={item.id} className="flex justify-between gap-4">
                    <span className="text-stone-400">
                      {product.name} · {variant.weight_value}{variant.weight_unit} × {Number(item.quantity)}
                    </span>
                    <span>R{((variant.retail_price_cents * Number(item.quantity)) / 100).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
              <span className="text-stone-400">Subtotal</span>
              <span className="text-lg font-semibold">R{(subtotal / 100).toFixed(2)}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-stone-600">
              Payment integration comes next. This step currently creates an unpaid pending order.
            </p>
            <button className="btn-primary mt-6 w-full" type="submit">Place order</button>
            <Link href="/cart" className="btn-secondary mt-3 w-full">Back to cart</Link>
          </aside>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-stone-300">{label}</span>
      {children}
    </label>
  );
}
