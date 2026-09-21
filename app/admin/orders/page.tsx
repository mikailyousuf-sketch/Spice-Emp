import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,order_number,email,status,payment_status,fulfilment_status,total_cents,created_at")
    .order("created_at", { ascending: false });

  return (
    <section>
      <span className="eyebrow">Commerce</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Orders</h1>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error.message}</p> : null}

      <div className="mt-8 grid gap-3">
        {orders?.length ? orders.map((order) => (
          <Link key={order.id} href={`/admin/orders/${order.id}`} className="glass-soft rounded-2xl p-5 transition hover:-translate-y-0.5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="display-font text-xl font-semibold">{order.order_number}</p>
                <p className="mt-1 text-xs text-stone-500">{order.email} · {new Date(order.created_at).toLocaleDateString("en-ZA")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">R{(order.total_cents / 100).toFixed(2)}</p>
                <p className="mt-1 text-xs text-stone-500">{order.status} · {order.payment_status}</p>
              </div>
            </div>
          </Link>
        )) : <div className="glass-soft rounded-2xl p-8 text-stone-500">No orders yet.</div>}
      </div>
    </section>
  );
}
