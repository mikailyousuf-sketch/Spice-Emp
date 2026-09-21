import Link from "next/link";

export const metadata = { title: "Payment pending" };

export default function PaymentPendingPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <div className="glass mx-auto max-w-2xl rounded-[2.5rem] p-8 text-center sm:p-10">
          <span className="eyebrow">Payment pending</span>
          <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">
            We&apos;re still confirming the payment.
          </h1>
          <p className="mt-5 text-stone-400">
            Your order is recorded. Don&apos;t pay twice. You can check your account orders or return shortly.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/account/orders" className="btn-primary">My orders</Link>
            <Link href="/shop" className="btn-secondary">Back to shop</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
