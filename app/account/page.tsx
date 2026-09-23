import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteAddress, saveAddress, updateProfile } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "My account" };

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

export default async function AccountPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const userId = await requireUser();
  const supabase = await createClient();

  const [
    { data: profile },
    { data: roles },
    { data: addresses },
    { data: recentOrders },
    { count: orderCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name,last_name,phone,account_type")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default_shipping", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id,order_number,status,fulfilment_status,total_cents,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const isAdmin = roles?.some(({ role }) => role === "admin" || role === "super_admin");
  const isBusiness = profile?.account_type === "business";

  return (
    <main className="account-page pt-32">
      <section className="section-wrap py-16 sm:py-20">
        <header className="account-hero">
          <div>
            <span className="eyebrow">My pantry</span>
            <h1 className="display-font mt-4 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
              {profile?.first_name ? \`Welcome, \${profile.first_name}.\` : "Your account."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7">
              Manage your details, delivery addresses and orders from one place.
            </p>
          </div>

          <div className="account-hero-actions">
            <Link href="/account/orders" className="btn-primary">View all orders</Link>
            {isAdmin ? <Link href="/admin" className="btn-secondary">Open admin</Link> : null}
          </div>
        </header>

        {error ? <p className="account-alert account-alert-error mt-7">{error}</p> : null}
        {saved ? <p className="account-alert account-alert-success mt-7">Account updated.</p> : null}

        <div className="account-stat-grid mt-8">
          <div>
            <span>Account</span>
            <strong className="capitalize">{profile?.account_type ?? "retail"}</strong>
          </div>
          <div>
            <span>Orders</span>
            <strong>{orderCount ?? 0}</strong>
          </div>
          <div>
            <span>Saved addresses</span>
            <strong>{addresses?.length ?? 0}</strong>
          </div>
          <div>
            <span>Wholesale</span>
            <strong>{isBusiness ? "Approved" : "Retail account"}</strong>
          </div>
        </div>

        <div className="account-grid mt-8">
          <section className="account-card">
            <div className="account-card-head">
              <div>
                <span>Profile</span>
                <h2>Your details</h2>
              </div>
            </div>

            <form action={updateProfile} className="account-form mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <input name="firstName" defaultValue={profile?.first_name ?? ""} required className="field" />
                </Field>
                <Field label="Last name">
                  <input name="lastName" defaultValue={profile?.last_name ?? ""} required className="field" />
                </Field>
              </div>

              <Field label="Phone number">
                <input name="phone" defaultValue={profile?.phone ?? ""} className="field" />
              </Field>

              <button type="submit" className="btn-primary w-fit">Save profile</button>
            </form>
          </section>

          <section className="account-card">
            <div className="account-card-head">
              <div>
                <span>Recent activity</span>
                <h2>Latest orders</h2>
              </div>
              <Link href="/account/orders">Order history →</Link>
            </div>

            <div className="mt-6 grid gap-3">
              {recentOrders?.length ? recentOrders.map((order) => (
                <Link href={\`/account/orders/\${order.id}\`} key={order.id} className="account-order-row">
                  <div>
                    <strong>{order.order_number}</strong>
                    <span>{new Date(order.created_at).toLocaleDateString("en-ZA")}</span>
                  </div>
                  <div>
                    <strong>R{(order.total_cents / 100).toFixed(2)}</strong>
                    <span>{order.fulfilment_status}</span>
                  </div>
                </Link>
              )) : (
                <div className="account-empty">
                  <strong>No orders yet.</strong>
                  <span>Your completed purchases will appear here.</span>
                  <Link href="/shop">Browse the pantry →</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="account-card mt-8">
          <div className="account-card-head">
            <div>
              <span>Delivery</span>
              <h2>Saved addresses</h2>
            </div>
            <p>Keep your usual delivery details ready for future orders.</p>
          </div>

          {addresses?.length ? (
            <div className="account-address-grid mt-6">
              {addresses.map((address) => (
                <article className="account-address-card" key={address.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span>{address.is_default_shipping ? "Default delivery" : address.label || "Saved address"}</span>
                      <h3>{address.label || \`\${address.first_name} \${address.last_name}\`}</h3>
                    </div>
                    {address.is_default_shipping ? <b>Default</b> : null}
                  </div>

                  <p>
                    {address.line1}
                    {address.line2 ? \`, \${address.line2}\` : ""}
                    <br />
                    {address.suburb ? \`\${address.suburb}, \` : ""}
                    {address.city}, {address.province} {address.postal_code}
                  </p>

                  <details className="account-address-edit">
                    <summary>Edit address</summary>
                    <AddressForm address={address} />
                  </details>

                  <form action={deleteAddress} className="mt-3">
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className="account-delete-button">Remove address</button>
                  </form>
                </article>
              ))}
            </div>
          ) : null}

          <details className="account-new-address mt-6" open={!addresses?.length}>
            <summary>+ Add delivery address</summary>
            <AddressForm />
          </details>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          {!isBusiness ? <Link href="/business" className="btn-secondary">Apply for wholesale</Link> : null}
          <form action="/auth/signout" method="post">
            <button className="btn-secondary" type="submit">Sign out</button>
          </form>
        </div>
      </section>
    </main>
  );
}

type Address = {
  id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  phone: string;
  line1: string;
  line2: string | null;
  suburb: string | null;
  city: string;
  province: string;
  postal_code: string;
  is_default_shipping: boolean;
};

function AddressForm({ address }: { address?: Address }) {
  return (
    <form action={saveAddress} className="account-form mt-5">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <Field label="Label">
        <input name="label" defaultValue={address?.label ?? ""} placeholder="Home, office, studio…" className="field" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input name="firstName" defaultValue={address?.first_name ?? ""} required className="field" />
        </Field>
        <Field label="Last name">
          <input name="lastName" defaultValue={address?.last_name ?? ""} required className="field" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input name="phone" defaultValue={address?.phone ?? ""} required className="field" />
        </Field>
        <Field label="Company (optional)">
          <input name="company" defaultValue={address?.company ?? ""} className="field" />
        </Field>
      </div>

      <Field label="Street address">
        <input name="line1" defaultValue={address?.line1 ?? ""} required className="field" />
      </Field>

      <Field label="Unit / building (optional)">
        <input name="line2" defaultValue={address?.line2 ?? ""} className="field" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Suburb">
          <input name="suburb" defaultValue={address?.suburb ?? ""} className="field" />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={address?.city ?? ""} required className="field" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Province">
          <select name="province" defaultValue={address?.province ?? ""} required className="field">
            <option value="" disabled>Select province</option>
            {provinces.map((province) => <option value={province} key={province}>{province}</option>)}
          </select>
        </Field>
        <Field label="Postal code">
          <input name="postalCode" defaultValue={address?.postal_code ?? ""} required className="field" />
        </Field>
      </div>

      <label className="account-check-row">
        <input
          type="checkbox"
          name="isDefaultShipping"
          defaultChecked={Boolean(address?.is_default_shipping)}
        />
        <span>
          <strong>Default delivery address</strong>
          <small>Use this as your preferred address.</small>
        </span>
      </label>

      <button type="submit" className="btn-primary w-fit">
        {address ? "Save address" : "Add address"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}
