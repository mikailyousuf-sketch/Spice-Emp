import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { retryPayment } from "./actions";

type Props = {
  searchParams: Promise<{ order?: string; error?: string }>;
};

export const metadata = { title: "Payment unsuccessful" };

export default async function PaymentFailedPage({ searchParams }: Props) {
  const { order: token, error } = await searchParams;
  const admin = createAdminClient();

  const { data: order } = token
    ? await admin
        .from("orders")
        .select("order_number,email,total_cents,payment_status")
        .eq("order_access_token", token)
        .maybeSingle()
    : { data: null };

  if (order?.payment_status === "paid" && token) {
    return (
      <main className="pt-32">
        <section className="section-wrap py-24">
          <div className="glass mx-auto max-w-2xl rounded-[2.5rem] p-8 text-center sm:p-10">
            <span className="eyebrow">Payment received</span>
            <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">
              This order is already paid.
            </h1>
            <Link href={`/order-confirmation/${token}`} className="btn-primary mt-8">
              View confirmation
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <div className="glass mx-auto max-w-2xl rounded-[2.5rem] p-8 sm:p-10">
          <div className="text-center">
            <span className="eyebrow">Payment unsuccessful</span>
            <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">
              Your payment wasn&apos;t completed.
            </h1>
            <p className="mt-5 text-stone-400">
              No successful payment has been recorded. Any reserved stock from the
              failed attempt has been released safely.
            </p>
          </div>

          {error ? (
            <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
              {error}
            </p>
          ) : null}

          {order && token ? (
            <div className="payment-retry-card mt-8">
              <div>
                <span>Order</span>
                <strong>{order.order_number}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>R{(Number(order.total_cents) / 100).toFixed(2)}</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>{order.email}</strong>
              </div>

              <form action={retryPayment} className="mt-5">
                <input type="hidden" name="order" value={token} />
                <button type="submit" className="btn-primary w-full">
                  Retry payment
                </button>
              </form>

              <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                We&apos;ll re-check stock before opening a fresh secure payment session.
                You will not be charged twice for a completed order.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-secondary">
              Return to shop
            </Link>
            <Link href="/contact" className="btn-secondary">
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
