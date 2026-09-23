import Link from "next/link";
import { login } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="auth-page pt-32">
      <section className="section-wrap py-20">
        <div className="auth-card mx-auto max-w-lg rounded-[2rem] p-7 sm:p-9">
          <span className="eyebrow">Account</span>
          <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-.04em]">Sign in</h1>

          {error ? (
            <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <form action={login} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm">
              <span className="text-stone-300">Email</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-stone-300">Password</span>
              <input name="password" type="password" required minLength={6} autoComplete="current-password" className="field" />
            </label>
            <button className="btn-primary mt-2" type="submit">Sign in</button>
          </form>

          <p className="mt-6 text-sm text-stone-400">
            No account yet? <Link href="/auth/sign-up" className="text-orange-200">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
