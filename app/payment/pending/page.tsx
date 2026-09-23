import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export const metadata = { title: "Payment pending" };

export default async function PaymentPendingPage({ searchParams }: Props) {
  const { order: token } = await searchParams;

  if (token) {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("payment_status")
      .eq("order_access_token", token)
      .maybeSingle();

    if (order?.payment_status === "paid") {
      redirect("/order-confirmation/" + token);
    }
  }

  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <div className="glass mx-auto max-w-2xl rounded-[2.5rem] p-8 text-center sm:p-10">
          <span className="eyebrow">Payment pending</span>
          <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">
            We&apos;re still confirming the payment.
          </h1>
          <p className="mt-5 text-stone-400">
            Your order is recorded. Don&apos;t pay twice. Payment callbacks and webhooks
            can take a short while to settle.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {token ? (
              <Link href={"/payment/pending?order=" + token} className="btn-primary">
                Check payment again
              </Link>
            ) : null}
            <Link href="/account/orders" className="btn-secondary">My orders</Link>
            <Link href="/contact" className="btn-secondary">Need help?</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
