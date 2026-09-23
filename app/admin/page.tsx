import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

function saBoundary(daysAgo = 0, startOfWeek = false, startOfMonth = false) {
  const now = new Date();
  const sa = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  if (startOfMonth) {
    sa.setUTCDate(1);
  } else if (startOfWeek) {
    const day = sa.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    sa.setUTCDate(sa.getUTCDate() - diff);
  } else if (daysAgo) {
    sa.setUTCDate(sa.getUTCDate() - daysAgo);
  }

  sa.setUTCHours(0, 0, 0, 0);
  return new Date(sa.getTime() - 2 * 60 * 60 * 1000).toISOString();
}

function money(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const todayStart = saBoundary();
  const weekStart = saBoundary(0, true);
  const monthStart = saBoundary(0, false, true);

  const [
    { data: paidOrdersMonth },
    { data: ordersTodayData },
    { count: fulfilmentQueue },
    { count: wholesaleQueue },
    { data: variants },
    { data: recentOrders },
    { data: shippingSettings },
    { data: shippingOrders },
    { count: aiSearchesToday },
    { count: aiSearchesWeek },
    { count: aiSearchesMonth },
    { count: aiNoMatchMonth },
    { data: recentAiSearches },
    { data: recentWholesale },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total_cents,created_at")
      .eq("payment_status", "paid")
      .gte("created_at", monthStart),

    supabase
      .from("orders")
      .select("id,total_cents,payment_status,created_at")
      .gte("created_at", todayStart),

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
      .select("id,sku,weight_value,weight_unit,stock_quantity,low_stock_threshold,is_active,products(id,name,slug,is_active)")
      .eq("is_active", true),

    supabase
      .from("orders")
      .select("id,order_number,email,status,payment_status,fulfilment_status,total_cents,shipping_method_snapshot,created_at")
      .order("created_at", { ascending: false })
      .limit(7),

    supabase
      .from("shipping_settings")
      .select("uber_online,uber_radius_km,uber_fee_cents,updated_at")
      .eq("id", true)
      .maybeSingle(),

    supabase
      .from("orders")
      .select("shipping_method_snapshot")
      .gte("created_at", monthStart)
      .not("shipping_method_snapshot", "is", null),

    supabase
      .from("assistant_queries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),

    supabase
      .from("assistant_queries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStart),

    supabase
      .from("assistant_queries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),

    supabase
      .from("assistant_queries")
      .select("*", { count: "exact", head: true })
      .eq("strong_match", false)
      .gte("created_at", monthStart),

    supabase
      .from("assistant_queries")
      .select("id,query_text,created_at,strong_match")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("business_enquiries")
      .select("id,company_name,contact_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const paidMonth = paidOrdersMonth ?? [];
  const todayOrders = ordersTodayData ?? [];

  const monthRevenue = paidMonth.reduce(
    (sum, order) => sum + Number(order.total_cents || 0),
    0,
  );

  const weekRevenue = paidMonth
    .filter((order) => order.created_at >= weekStart)
    .reduce((sum, order) => sum + Number(order.total_cents || 0), 0);

  const todayRevenue = todayOrders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total_cents || 0), 0);

  const lowStockVariants = (variants ?? [])
    .filter((variant) =>
      Number(variant.stock_quantity) <= Number(variant.low_stock_threshold),
    )
    .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity));

  const shippingCounts = new Map<string, number>();
  for (const order of shippingOrders ?? []) {
    const snapshot = String(order.shipping_method_snapshot ?? "").toLowerCase();
    const label = snapshot.includes("pudo")
      ? "PUDO locker"
      : snapshot.includes("uber")
        ? "Uber delivery"
        : snapshot.includes("door") || snapshot.includes("courier")
          ? "Door to door"
          : "Other";

    shippingCounts.set(label, (shippingCounts.get(label) ?? 0) + 1);
  }

  const shippingRanked = [...shippingCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topShipping = shippingRanked[0];

  const activity = [
    ...(recentOrders ?? []).map((order) => ({
      id: `order-${order.id}`,
      type: "Order",
      title: order.order_number,
      detail: `${order.email} · ${money(Number(order.total_cents || 0))}`,
      status: `${order.payment_status} · ${order.fulfilment_status}`,
      createdAt: order.created_at,
      href: `/admin/orders/${order.id}`,
    })),
    ...(recentWholesale ?? []).map((enquiry) => ({
      id: `wholesale-${enquiry.id}`,
      type: "Wholesale",
      title: enquiry.company_name,
      detail: enquiry.contact_name,
      status: enquiry.status,
      createdAt: enquiry.created_at,
      href: "/admin/business",
    })),
    ...(recentAiSearches ?? []).map((search) => ({
      id: `ai-${search.id}`,
      type: "AI search",
      title: search.query_text,
      detail: "Customer pantry search",
      status: search.strong_match ? "matched" : "no match",
      createdAt: search.created_at,
      href: null,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <section>
      <div className="admin-dashboard-head">
        <div>
          <span className="eyebrow">Operations</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">
            Control room
          </h1>
          <p className="mt-4 max-w-2xl text-stone-400">
            Live business health across sales, fulfilment, stock, wholesale,
            delivery and customer demand.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/orders" className="btn-primary">
            Manage orders
          </Link>
          <Link href="/admin/business" className="btn-secondary">
            Wholesale queue
          </Link>
        </div>
      </div>

      <div className="admin-metric-grid mt-8">
        <Metric
          label="Revenue today"
          value={money(todayRevenue)}
          detail={`${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"} today`}
        />
        <Metric
          label="Revenue this week"
          value={money(weekRevenue)}
          detail="Paid orders since Monday"
        />
        <Metric
          label="Revenue this month"
          value={money(monthRevenue)}
          detail={`${paidMonth.length} paid order${paidMonth.length === 1 ? "" : "s"}`}
        />
        <Metric
          label="Needs fulfilment"
          value={String(fulfilmentQueue ?? 0)}
          detail="Paid · unfulfilled / processing"
          attention={Boolean(fulfilmentQueue)}
        />
        <Metric
          label="Low stock"
          value={String(lowStockVariants.length)}
          detail="At or below threshold"
          attention={lowStockVariants.length > 0}
        />
        <Metric
          label="Wholesale queue"
          value={String(wholesaleQueue ?? 0)}
          detail="New or under review"
          attention={Boolean(wholesaleQueue)}
        />
        <Metric
          label="AI searches today"
          value={String(aiSearchesToday ?? 0)}
          detail={`${aiSearchesWeek ?? 0} this week · ${aiNoMatchMonth ?? 0} no-match this month`}
        />
        <Metric
          label="Uber delivery"
          value={shippingSettings?.uber_online ? "Online" : "Offline"}
          detail={
            shippingSettings?.uber_online
              ? `${Number(shippingSettings.uber_radius_km).toFixed(0)} km · ${money(Number(shippingSettings.uber_fee_cents || 0))}`
              : "Unavailable at checkout"
          }
          live={Boolean(shippingSettings?.uber_online)}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="glass-soft rounded-[2rem] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">
                Business activity
              </span>
              <h2 className="display-font mt-2 text-2xl font-semibold">
                What just happened
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {activity.length ? (
              activity.map((item) => {
                const body = (
                  <>
                    <div className="min-w-0">
                      <span className="text-[.62rem] font-extrabold uppercase tracking-[.14em] text-stone-500">
                        {item.type}
                      </span>
                      <strong className="mt-1 block truncate">{item.title}</strong>
                      <span className="mt-1 block truncate text-xs text-stone-500">
                        {item.detail}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="block text-xs capitalize">{item.status}</strong>
                      <span className="mt-1 block text-[.68rem] text-stone-500">
                        {new Date(item.createdAt).toLocaleString("en-ZA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Africa/Johannesburg",
                        })}
                      </span>
                    </div>
                  </>
                );

                return item.href ? (
                  <Link
                    href={item.href}
                    key={item.id}
                    className="admin-recent-order"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={item.id} className="admin-recent-order">
                    {body}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-500">
                No activity yet.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6">
          <section className="glass-soft rounded-[2rem] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">
                  Fulfilment
                </span>
                <h2 className="display-font mt-2 text-2xl font-semibold">
                  Stock pressure
                </h2>
              </div>
              <Link href="/admin/inventory" className="text-xs font-bold uppercase tracking-[.1em]">
                Inventory →
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {lowStockVariants.length ? (
                lowStockVariants.slice(0, 6).map((variant) => {
                  const product = Array.isArray(variant.products)
                    ? variant.products[0]
                    : variant.products;

                  return (
                    <Link
                      key={variant.id}
                      href={product?.id ? `/admin/products/${product.id}` : "/admin/inventory"}
                      className="admin-recent-order"
                    >
                      <div>
                        <strong>{product?.name ?? "Unknown product"}</strong>
                        <span>
                          {variant.weight_value}
                          {variant.weight_unit} · {variant.sku}
                        </span>
                      </div>
                      <div className="text-right">
                        <strong>{variant.stock_quantity} left</strong>
                        <span>Low at {variant.low_stock_threshold}</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-500">
                  Stock levels are healthy.
                </p>
              )}
            </div>
          </section>

          <section className="glass-soft rounded-[2rem] p-6">
            <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">
              Delivery mix · this month
            </span>
            <h2 className="display-font mt-2 text-2xl font-semibold">
              Shipping demand
            </h2>

            <div className="mt-5 grid gap-3">
              {shippingRanked.length ? (
                shippingRanked.map(([label, count]) => (
                  <div key={label} className="admin-recent-order">
                    <div>
                      <strong>{label}</strong>
                      <span>{topShipping?.[0] === label ? "Most used" : "Orders"}</span>
                    </div>
                    <div className="text-right">
                      <strong>{count}</strong>
                      <span>
                        {Math.round(
                          (count /
                            Math.max(
                              1,
                              shippingRanked.reduce((sum, [, qty]) => sum + qty, 0),
                            )) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-500">
                  Shipping usage will appear after orders are placed.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <section className="glass-soft rounded-[2rem] p-6">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">
            Customer intent
          </span>
          <h2 className="display-font mt-2 text-2xl font-semibold">
            Recent AI searches
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Useful demand signals for future products and catalogue wording.
            {aiNoMatchMonth ? ` ${aiNoMatchMonth} searches this month had no strong catalogue match.` : ""}
          </p>

          <div className="mt-5 grid gap-3">
            {recentAiSearches?.length ? (
              recentAiSearches.map((search) => (
                <div key={search.id} className="admin-recent-order">
                  <div>
                    <strong className="line-clamp-2">{search.query_text}</strong>
                    <span>
                      {new Date(search.created_at).toLocaleString("en-ZA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Johannesburg",
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-500">
                No AI searches recorded yet.
              </p>
            )}
          </div>
        </section>

        <section className="glass-soft rounded-[2rem] p-6">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">
            Quick access
          </span>
          <h2 className="display-font mt-2 text-2xl font-semibold">
            Operations
          </h2>

          <div className="admin-quick-grid mt-5">
            <Link href="/admin/orders">
              Orders <span>{fulfilmentQueue || "→"}</span>
            </Link>
            <Link href="/admin/inventory">
              Inventory <span>{lowStockVariants.length || "→"}</span>
            </Link>
            <Link href="/admin/business">
              Wholesale <span>{wholesaleQueue || "→"}</span>
            </Link>
            <Link href="/admin/shipping">
              Shipping <span>{shippingSettings?.uber_online ? "Uber on" : "Uber off"}</span>
            </Link>
            <Link href="/admin/products">
              Catalogue <span>→</span>
            </Link>
            <Link href="/admin/taxonomy">
              Taxonomy <span>→</span>
            </Link>
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
    <article
      className={
        attention
          ? "admin-metric is-attention"
          : live
            ? "admin-metric is-live"
            : "admin-metric"
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
