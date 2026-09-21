import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ token: string }>;
};

export const metadata = { title: "Order confirmation" };

export default async function OrderConfirmationPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(`
      order_number,email,status,payment_status,fulfilment_status,total_cents,created_at,
      order_items(id,product_name_snapshot,variant_name_snapshot,sku_snapshot,quantity,unit_price_cents,total_price_cents)
    `)
    .eq("order_access_token", token)
    .maybeSingle();

  if (!order) notFound();

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <div className="glass mx-auto max-w-3xl rounded-[2.5rem] p-7 sm:p-10">
          <span className="eyebrow">Order received</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">
            {order.order_number}
          </h1>
          <p className="mt-5 text-stone-400">
            Your order has been recorded for {order.email}. Payment is currently marked as
            <span className="font-semibold text-stone-200"> {order.payment_status}</span>.
          </p>

          <div className="mt-8 grid gap-3">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
                <div>
                  <p className="font-semibold">{item.product_name_snapshot}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.variant_name_snapshot} · {item.sku_snapshot} · qty {Number(item.quantity)}
                  </p>
                </div>
                <p>R{(item.total_price_cents / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
            <span className="text-stone-400">Order total</span>
            <span className="text-xl font-semibold">R{(order.total_cents / 100).toFixed(2)}</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">Continue shopping</Link>
            <Link href="/account" className="btn-secondary">My account</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
