import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ token: string }>;
};

export const metadata = { title: "Order confirmation" };

function statusCopy(status: string, fulfilment: string) {
  if (status === "shipped") return "Your order has left us and is on the way.";
  if (status === "completed") return "Your order has been completed.";
  if (status === "processing" || fulfilment === "processing") {
    return "We’re preparing and packing your order.";
  }
  if (status === "cancelled") return "This order has been cancelled.";
  return "Payment is confirmed and your order is queued for fulfilment.";
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(`
      order_number,email,phone,status,payment_status,fulfilment_status,
      subtotal_cents,shipping_cents,discount_cents,tax_cents,total_cents,
      shipping_method_snapshot,shipping_address,tracking_reference,dispatched_at,created_at,
      order_items(id,product_name_snapshot,variant_name_snapshot,sku_snapshot,quantity,unit_price_cents,total_price_cents)
    `)
    .eq("order_access_token", token)
    .maybeSingle();

  if (!order) notFound();

  const address = order.shipping_address as Record<string, string | null>;
  const paid = order.payment_status === "paid";

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <div className="order-confirmation-shell mx-auto max-w-4xl">
          <div className="order-confirmation-hero">
            <span className="eyebrow">{paid ? "Payment confirmed" : "Order received"}</span>
            <h1>{order.order_number}</h1>
            <p>{statusCopy(order.status, order.fulfilment_status)}</p>

            <div className="order-confirmation-status">
              <span>
                <b>Payment</b>
                {order.payment_status}
              </span>
              <span>
                <b>Order</b>
                {order.status}
              </span>
              <span>
                <b>Fulfilment</b>
                {order.fulfilment_status}
              </span>
            </div>
          </div>

          <div className="order-confirmation-grid">
            <section className="order-confirmation-card">
              <span className="order-confirmation-label">What happens next</span>
              <h2>We’ll take it from here.</h2>

              <div className="order-confirmation-steps">
                <div className={paid ? "is-complete" : ""}>
                  <span>01</span>
                  <div>
                    <strong>Payment confirmed</strong>
                    <p>Your payment is matched to this order.</p>
                  </div>
                </div>
                <div className={["processing", "shipped", "completed"].includes(order.status) ? "is-complete" : ""}>
                  <span>02</span>
                  <div>
                    <strong>Preparing your pantry order</strong>
                    <p>We pick, check and pack the items in your order.</p>
                  </div>
                </div>
                <div className={["shipped", "completed"].includes(order.status) ? "is-complete" : ""}>
                  <span>03</span>
                  <div>
                    <strong>Delivery</strong>
                    <p>{order.shipping_method_snapshot || "Your selected delivery method will be used."}</p>
                  </div>
                </div>
              </div>

              {order.tracking_reference ? (
                <div className="order-confirmation-tracking">
                  <span>Tracking / delivery reference</span>
                  <strong>{order.tracking_reference}</strong>
                </div>
              ) : null}
            </section>

            <aside className="order-confirmation-card">
              <span className="order-confirmation-label">Delivery to</span>
              <h2>{address.first_name} {address.last_name}</h2>
              <div className="order-confirmation-address">
                {address.company ? <p>{address.company}</p> : null}
                <p>{address.line1}</p>
                {address.line2 ? <p>{address.line2}</p> : null}
                {address.suburb ? <p>{address.suburb}</p> : null}
                <p>{address.city}, {address.province}</p>
                <p>{address.postal_code}</p>
              </div>
              <div className="order-confirmation-contact">
                <span>{order.email}</span>
                <span>{order.phone}</span>
              </div>
            </aside>
          </div>

          <section className="order-confirmation-card order-confirmation-items">
            <div className="order-confirmation-card-head">
              <div>
                <span className="order-confirmation-label">Your order</span>
                <h2>Items purchased</h2>
              </div>
              <span>{order.order_items?.length ?? 0} line item{order.order_items?.length === 1 ? "" : "s"}</span>
            </div>

            <div className="order-confirmation-item-list">
              {order.order_items?.map((item) => (
                <div key={item.id}>
                  <div>
                    <strong>{item.product_name_snapshot}</strong>
                    <span>
                      {item.variant_name_snapshot} · {item.sku_snapshot} · qty {Number(item.quantity)}
                    </span>
                  </div>
                  <strong>R{(item.total_price_cents / 100).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="order-confirmation-totals">
              <div><span>Subtotal</span><strong>R{(order.subtotal_cents / 100).toFixed(2)}</strong></div>
              <div><span>Delivery</span><strong>R{(order.shipping_cents / 100).toFixed(2)}</strong></div>
              {order.discount_cents ? (
                <div><span>Discount</span><strong>-R{(order.discount_cents / 100).toFixed(2)}</strong></div>
              ) : null}
              {order.tax_cents ? (
                <div><span>Tax</span><strong>R{(order.tax_cents / 100).toFixed(2)}</strong></div>
              ) : null}
              <div className="is-total"><span>Amount paid</span><strong>R{(order.total_cents / 100).toFixed(2)}</strong></div>
            </div>
          </section>

          <div className="order-confirmation-actions">
            <Link href="/account/orders" className="btn-primary">Track in my account</Link>
            <Link href="/shop" className="btn-secondary">Continue shopping</Link>
            <Link href="/contact" className="btn-secondary">Need help?</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
