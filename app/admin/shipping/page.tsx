import { createClient } from "@/lib/supabase/server";
import { updateUberSettings } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Shipping" };

export default async function ShippingAdminPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const [{ data: methods }, { data: settings }] = await Promise.all([
    supabase
      .from("shipping_methods")
      .select("id,code,name,description,fee_cents,is_active,sort_order")
      .in("code", ["door-to-door", "pudo-locker", "uber-delivery"])
      .order("sort_order"),
    supabase
      .from("shipping_settings")
      .select("uber_online,uber_origin_label,uber_origin_lat,uber_origin_lng,uber_radius_km,uber_fee_cents")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const byCode = new Map((methods ?? []).map((method) => [method.code, method]));
  const door = byCode.get("door-to-door");
  const pudo = byCode.get("pudo-locker");
  const uber = byCode.get("uber-delivery");

  return (
    <section>
      <span className="eyebrow">Commerce configuration</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Shipping</h1>
      <p className="mt-4 max-w-2xl text-stone-400">
        Simple fixed delivery options. No courier API is required at checkout.
      </p>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
          Shipping settings updated.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <ShippingCard
          number="01"
          name={door?.name ?? "Door to door"}
          price="R120"
          detail="3–5 working days"
          subdetail="Shipped with The Courier Guy"
          status="Always available"
        />
        <ShippingCard
          number="02"
          name={pudo?.name ?? "PUDO locker pickup"}
          price="R75"
          detail="Locker pickup"
          subdetail="Customer collects from their selected locker"
          status="Always available"
        />
        <ShippingCard
          number="03"
          name={uber?.name ?? "Uber delivery"}
          price={\`R\${Math.min(100, Number(settings?.uber_fee_cents ?? 10000) / 100).toFixed(0)}\`}
          detail={\`\${Number(settings?.uber_radius_km ?? 15).toFixed(0)} km radius\`}
          subdetail={settings?.uber_origin_label || "Dispatch location not named"}
          status={settings?.uber_online ? "Online" : "Offline"}
          live={Boolean(settings?.uber_online)}
        />
      </div>

      <form action={updateUberSettings} className="glass-soft mt-8 rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-orange-200">
              Local delivery
            </span>
            <h2 className="display-font mt-2 text-3xl font-semibold">Uber delivery control</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
              Uber only appears at checkout while this switch is online. Customers must verify their
              current delivery location and be inside your configured radius.
            </p>
          </div>

          <label className="admin-check-row min-w-[220px]">
            <input
              type="checkbox"
              name="uberOnline"
              defaultChecked={Boolean(settings?.uber_online)}
            />
            <span>
              <strong>Uber delivery online</strong>
              <small>Turn this off whenever you cannot dispatch local orders.</small>
            </span>
          </label>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <Field label="Dispatch location name">
            <input
              name="originLabel"
              defaultValue={settings?.uber_origin_label ?? ""}
              placeholder="e.g. Eldoraigne dispatch point"
              className="field"
            />
          </Field>

          <Field label="Service radius (km)">
            <input
              name="radiusKm"
              type="number"
              min="1"
              max="100"
              step="0.5"
              defaultValue={Number(settings?.uber_radius_km ?? 15)}
              required
              className="field"
            />
          </Field>

          <Field label="Dispatch latitude">
            <input
              name="originLat"
              type="number"
              min="-90"
              max="90"
              step="0.0000001"
              defaultValue={settings?.uber_origin_lat == null ? "" : String(settings.uber_origin_lat)}
              placeholder="-25.8..."
              className="field"
            />
          </Field>

          <Field label="Dispatch longitude">
            <input
              name="originLng"
              type="number"
              min="-180"
              max="180"
              step="0.0000001"
              defaultValue={settings?.uber_origin_lng == null ? "" : String(settings.uber_origin_lng)}
              placeholder="28.1..."
              className="field"
            />
          </Field>

          <Field label="Uber delivery fee (maximum R100)">
            <input
              name="feeRand"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={Math.min(100, Number(settings?.uber_fee_cents ?? 10000) / 100)}
              required
              className="field"
            />
          </Field>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-stone-400">
          To get coordinates, drop a pin on your dispatch location in Google Maps and copy the latitude
          and longitude. The distance check happens again on the server, so Uber cannot be selected
          outside the configured radius.
        </div>

        <button type="submit" className="btn-primary mt-6">Save Uber settings</button>
      </form>
    </section>
  );
}

function ShippingCard({
  number,
  name,
  price,
  detail,
  subdetail,
  status,
  live = false,
}: {
  number: string;
  name: string;
  price: string;
  detail: string;
  subdetail: string;
  status: string;
  live?: boolean;
}) {
  return (
    <article className="glass-soft rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-[.14em] text-stone-500">{number}</span>
        <span className={live ? "admin-featured-badge" : "text-xs text-stone-500"}>{status}</span>
      </div>
      <h2 className="display-font mt-5 text-2xl font-semibold">{name}</h2>
      <p className="mt-3 text-3xl font-semibold text-orange-100">{price}</p>
      <p className="mt-4 text-sm text-stone-300">{detail}</p>
      <p className="mt-1 text-xs leading-5 text-stone-500">{subdetail}</p>
    </article>
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
