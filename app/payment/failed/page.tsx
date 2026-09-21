import Link from "next/link";

export const metadata = { title: "Payment unsuccessful" };

export default function PaymentFailedPage() {
  return (
    <main className="pt-32">
      <section className="section-wrap py-24">
        <div className="glass mx-auto max-w-2xl rounded-[2.5rem] p-8 text-center sm:p-10">
          <span className="eyebrow">Payment unsuccessful</span>
          <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">
            The payment wasn&apos;t completed.
          </h1>
          <p className="mt-5 text-stone-400">
            Reserved stock has been released when the failure or cancellation was confirmed.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/shop" className="btn-primary">Return to shop</Link>
            <Link href="/contact" className="btn-secondary">Contact support</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
