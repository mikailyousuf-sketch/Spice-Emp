import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [
    { count: products },
    { count: ordersToday },
    { data: paidOrders },
    { count: fulfilmentQueue },
    { count: wholesaleQueue },
    { data: variants },
    { data: recentOrders },
    { data: shippingSettings },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("orders")
      .select("total_cents")
      .eq("payment_status", "paid")
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("fulfilment_status", ["unfulfilled", "processing"])
      .eq("payment_status", "paid"),
    supabase
      .from("business_enquiries")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "reviewing"]),
    supabase
      .from("product_variants")
      .select("id,stock_quantity,low_stock_threshold,is_active"),
    supabase
      .from("orders")
      .select("id,order_number,email,status,payment_status,fulfilment_status,total_cents,shipping_method_snapshot,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("shipping_settings")
      .select("uber_online,uber_radius_km,uber_fee_cents")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const monthRevenue = (paidOrders ?? []).reduce(
    (sum, order) => sum + Number(order.total_cents || 0),
    0,
  );

  const lowStock = (variants ?? []).filter((variant) =>
    variant.is_active
    && Number(variant.stock_quantity) <= Number(variant.low_stock_threshold),
  ).length;

  return (
    <section>
      <div className="admin-dashboard-head">
        <div>
          <span className="eyebrow">Operations</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Dashboard</h1>
          <p className="mt-4 max-w-2xl text-stone-400">
            What needs attention across orders, fulfilment, wholesale and local delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/orders" className="btn-primary">Manage orders</Link>
          <Link href="/admin/business" className="btn-secondary">Wholesale</Link>
        </div>
      </div>

      <div className="admin-metric-grid mt-8">
        <Metric label="Revenue this month" value={\`R\${(monthRevenue / 100).toFixed(2)}\`} detail="Paid orders only" />
        <Metric label="Orders today" value={String(ordersToday ?? 0)} detail="New orders since midnight" />
        <Metric label="Needs fulfilment" value={String(fulfilmentQueue ?? 0)} detail="Paid · unfulfilled / processing" attention={Boolean(fulfilmentQueue)} />
        <Metric label="Wholesale queue" value={String(wholesaleQueue ?? 0)} detail="New or under review" attention={Boolean(wholesaleQueue)} />
        <Metric label="Low stock" value={String(lowStock)} detail="At or below threshold" attention={lowStock > 0} />
        <Metric
          label="Uber delivery"
          value={shippingSettings?.uber_online ? "Online" : "Offline"}
          detail={shippingSettings?.uber_online
            ? \`\${Number(shippingSettings.uber_radius_km).toFixed(0)} km · R\${(Number(shippingSettings.uber_fee_cents) / 100).toFixed(0)}\`
            : "Not shown at checkout"}
          live={Boolean(shippingSettings?.uber_online)}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="glass-soft rounded-[2rem] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Commerce</span>
              <h2 className="display-font mt-2 text-2xl font-semibold">Recent orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-bold uppercase tracking-[.1em] text-orange-100">
              View all →
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {recentOrders?.length ? recentOrders.map((order) => (
              <Link href={\`/admin/orders/\${order.id}\`} key={order.id} className="admin-recent-order">
                <div>
                  <strong>{order.order_number}</strong>
                  <span>{order.email}</span>
                </div>
                <div>
                  <strong>R{(order.total_cents / 100).toFixed(2)}</strong>
                  <span>{order.payment_status} · {order.fulfilment_status}</span>
                </div>
              </Link>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-500">
                No orders yet.
              </div>
            )}
          </div>
        </section>

        <section className="glass-soft rounded-[2rem] p-6">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Quick access</span>
          <h2 className="display-font mt-2 text-2xl font-semibold">Operations</h2>
          <div className="admin-quick-grid mt-5">
            <Link href="/admin/orders">Orders <span>→</span></Link>
            <Link href="/admin/inventory">Inventory <span>{lowStock ? lowStock : "→"}</span></Link>
            <Link href="/admin/business">Wholesale <span>{wholesaleQueue ?? "→"}</span></Link>
            <Link href="/admin/shipping">Shipping <span>{shippingSettings?.uber_online ? "On" : "Off"}</span></Link>
            <Link href="/admin/products">Products <span>{products ?? 0}</span></Link>
            <Link href="/admin/products#featured-items">Featured shelf <span>→</span></Link>
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  attention = false,
  live = false,
}: {
  label: string;
  value: string;
  detail: string;
  attention?: boolean;
  live?: boolean;
}) {
  return (
    <article className={attention ? "admin-metric is-attention" : live ? "admin-metric is-live" : "admin-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
