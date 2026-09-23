import { redirect } from "next/navigation";
import { getCartSnapshot } from "@/lib/cart";
import { getCurrentUserId } from "@/lib/auth";
import { FixedShippingPicker } from "@/components/checkout/fixed-shipping-picker";
import { CheckoutControls } from "@/components/checkout/checkout-controls";
import { createOrder } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };
export const metadata = { title: "Checkout" };

const provinces = ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"];

export default async function CheckoutPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const cart = await getCartSnapshot();
  if (!cart?.items?.length) redirect("/cart");

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const [{ data: shippingMethods }, { data: shippingSettings }, { data: defaultAddress }] = await Promise.all([
    supabase
      .from("shipping_methods")
      .select("id,code,name,description,fee_cents")
      .eq("is_active", true)
      .in("code", ["door-to-door", "pudo-locker", "uber-delivery"])
      .order("sort_order")
      .order("name"),
    supabase
      .from("shipping_settings")
      .select("uber_online,uber_origin_label,uber_origin_lat,uber_origin_lng,uber_radius_km,uber_fee_cents")
      .eq("id", true)
      .maybeSingle(),
    userId
      ? supabase
          .from("addresses")
          .select("first_name,last_name,company,phone,line1,line2,suburb,city,province,postal_code")
          .eq("user_id", userId)
          .eq("is_default_shipping", true)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const subtotal = cart.items.reduce((sum, item) => {
    const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
    return variant ? sum + Math.round(Number(item.quantity) * variant.retail_price_cents) : sum;
  }, 0);

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Checkout</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">Delivery & payment</h1>
        {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}

        <form id="checkout-form" action={createOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <div className="glass-soft grid gap-5 rounded-[2rem] p-6 sm:p-8">
              <p className="display-font text-2xl font-semibold">Delivery details</p>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="First name"><input name="firstName" defaultValue={defaultAddress?.first_name ?? ""} required className="field" /></Field>
                <Field label="Last name"><input name="lastName" defaultValue={defaultAddress?.last_name ?? ""} required className="field" /></Field>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Email"><input name="email" type="email" required className="field" /></Field>
                <Field label="Phone"><input name="phone" defaultValue={defaultAddress?.phone ?? ""} required className="field" /></Field>
              </div>
              <Field label="Company (optional)"><input name="company" defaultValue={defaultAddress?.company ?? ""} className="field" /></Field>
              <Field label="Street address"><input name="line1" defaultValue={defaultAddress?.line1 ?? ""} required className="field" /></Field>
              <Field label="Apartment / unit / building (optional)"><input name="line2" defaultValue={defaultAddress?.line2 ?? ""} className="field" /></Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Suburb"><input name="suburb" defaultValue={defaultAddress?.suburb ?? ""} className="field" /></Field>
                <Field label="City"><input name="city" defaultValue={defaultAddress?.city ?? ""} required className="field" /></Field>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Province">
                  <select name="province" required defaultValue={defaultAddress?.province ?? ""} className="field">
                    <option value="" disabled>Select province</option>
                    {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                </Field>
                <Field label="Postal code"><input name="postalCode" defaultValue={defaultAddress?.postal_code ?? ""} required className="field" /></Field>
              </div>
              <Field label="Order notes (optional)"><textarea name="notes" rows={4} className="field resize-y" /></Field>
            </div>

            <div id="checkout-shipping" className="glass-soft rounded-[2rem] p-6 sm:p-8">
              <p className="display-font text-2xl font-semibold">Delivery method</p>
              <p className="mt-2 text-sm text-stone-500">
                Choose door delivery, PUDO locker pickup, or Uber when local delivery is online.
              </p>
              <FixedShippingPicker
                methods={shippingMethods ?? []}
                uberSettings={shippingSettings}
              />
            </div>

            <div className="glass-soft rounded-[2rem] p-6 sm:p-8">
              <p className="display-font text-2xl font-semibold">Payment method</p>
              <p className="mt-2 text-sm text-stone-500">You&apos;ll finish securely on the selected gateway.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="cursor-pointer">
                  <input type="radio" name="paymentProvider" value="yoco" defaultChecked className="peer sr-only" />
                  <span className="block rounded-2xl border border-white/10 bg-white/[.03] p-5 transition peer-checked:border-orange-300/40 peer-checked:bg-orange-300/10">
                    <span className="display-font text-lg font-semibold">Yoco</span>
                    <span className="mt-2 block text-sm text-stone-500">Primary South African gateway</span>
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="paymentProvider" value="paystack" className="peer sr-only" />
                  <span className="block rounded-2xl border border-white/10 bg-white/[.03] p-5 transition peer-checked:border-orange-300/40 peer-checked:bg-orange-300/10">
                    <span className="display-font text-lg font-semibold">Paystack</span>
                    <span className="mt-2 block text-sm text-stone-500">Alternative secure checkout</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <aside className="glass h-fit rounded-[2rem] p-6">
            <p className="display-font text-2xl font-semibold">Order summary</p>
            <div className="mt-6 grid gap-3 text-sm">
              {cart.items.map((item) => {
                const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
                const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;
                if (!variant || !product) return null;
                return (
                  <div key={item.id} className="flex justify-between gap-4">
                    <span className="text-stone-400">{product.name} · {variant.weight_value}{variant.weight_unit} × {Number(item.quantity)}</span>
                    <span>R{((variant.retail_price_cents * Number(item.quantity)) / 100).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <CheckoutControls subtotalCents={subtotal} />
          </aside>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm"><span className="text-stone-300">{label}</span>{children}</label>;
}
