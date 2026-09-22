import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="admin-shell pt-32">
      <div className="section-wrap grid gap-8 pb-24 lg:grid-cols-[220px_1fr]">
        <aside className="glass-soft h-fit rounded-[2rem] p-5">
          <p className="display-font px-3 pb-4 text-lg font-semibold">Spice Emp Admin</p>
          <nav className="grid gap-1 text-sm">
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin">Dashboard</Link>
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin/products">Products</Link>
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin/products/new">Add product</Link>
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin/inventory">Inventory</Link>
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin/taxonomy">Taxonomy</Link>
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin/orders">Orders</Link>
            <Link className="rounded-xl px-3 py-2 text-stone-300 hover:bg-white/5" href="/admin/shipping">Shipping</Link>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </main>
  );
}
