import Link from "next/link";
import { signUp } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export const metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: Props) {
  const { error, success } = await searchParams;

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <div className="glass mx-auto max-w-lg rounded-[2rem] p-7 sm:p-9">
          <span className="eyebrow">Account</span>
          <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">Create account</h1>

          {error ? <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</p> : null}
          {success ? <p className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{success}</p> : null}

          <form action={signUp} className="mt-8 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-stone-300">First name</span>
                <input name="firstName" required className="field" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-stone-300">Last name</span>
                <input name="lastName" required className="field" />
              </label>
            </div>
            <label className="grid gap-2 text-sm">
              <span className="text-stone-300">Email</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-stone-300">Password</span>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
            </label>
            <button className="btn-primary mt-2" type="submit">Create account</button>
          </form>

          <p className="mt-6 text-sm text-stone-400">
            Already registered? <Link href="/auth/login" className="text-orange-200">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
