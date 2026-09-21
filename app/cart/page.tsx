import Link from "next/link";
import { getCartSnapshot } from "@/lib/cart";
import { getProductImageUrl } from "@/lib/products/image-url";
import { removeCartItem, updateCartItem } from "./actions";

type Props = {
  searchParams: Promise<{ added?: string; updated?: string; removed?: string; error?: string }>;
};

export const metadata = { title: "Cart" };

export default async function CartPage({ searchParams }: Props) {
  const messages = await searchParams;
  const cart = await getCartSnapshot();

  const items = (cart?.items ?? []).flatMap((item) => {
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants;
    const product = Array.isArray(variant?.products)
      ? variant?.products[0]
      : variant?.products;

    if (!variant || !product || !variant.is_active || !product.is_active) return [];

    const images = [...(product.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );

    return [{ item, variant, product, image: images[0] }];
  });

  const subtotal = items.reduce(
    (sum, { item, variant }) => sum + Math.round(Number(item.quantity) * variant.retail_price_cents),
    0,
  );

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Your basket</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
          Cart
        </h1>

        {messages.error ? (
          <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
            {messages.error}
          </p>
        ) : null}

        {messages.added ? (
          <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
            Added to cart.
          </p>
        ) : null}

        {!items.length ? (
          <div className="glass-soft mt-8 rounded-[2rem] p-10 text-center">
            <p className="display-font text-2xl font-semibold">Your cart is empty.</p>
            <p className="mt-3 text-stone-500">Browse the catalogue and add a spice size to continue.</p>
            <Link href="/shop" className="btn-primary mt-6">Browse spices</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-4">
              {items.map(({ item, variant, product, image }) => {
                const imageUrl = getProductImageUrl(image?.storage_path);

                return (
                  <article key={item.id} className="glass-soft grid gap-5 rounded-[2rem] p-5 sm:grid-cols-[110px_1fr]">
                    <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      {imageUrl ? <img src={imageUrl} alt={image?.alt_text || product.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <Link href={`/spices/${product.slug}`} className="display-font text-xl font-semibold">
                            {product.name}
                          </Link>
                          <p className="mt-1 text-sm text-stone-500">
                            {variant.weight_value}{variant.weight_unit} · {variant.sku}
                          </p>
                        </div>
                        <p className="font-semibold text-orange-100">
                          R{((variant.retail_price_cents * Number(item.quantity)) / 100).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap items-end gap-3">
                        <form action={updateCartItem} className="flex items-end gap-2">
                          <input type="hidden" name="itemId" value={item.id} />
                          <label className="grid gap-2 text-xs text-stone-500">
                            Quantity
                            <input
                              name="quantity"
                              type="number"
                              min="1"
                              max={variant.stock_quantity}
                              step="1"
                              defaultValue={Number(item.quantity)}
                              className="field !w-28"
                            />
                          </label>
                          <button className="btn-secondary !min-h-11 !px-4 !py-2 text-sm" type="submit">Update</button>
                        </form>

                        <form action={removeCartItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button className="min-h-11 px-2 text-sm text-red-300 hover:text-red-200" type="submit">Remove</button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="glass h-fit rounded-[2rem] p-6">
              <p className="display-font text-2xl font-semibold">Summary</p>
              <div className="mt-6 flex items-center justify-between border-b border-white/10 pb-4 text-sm">
                <span className="text-stone-400">Subtotal</span>
                <span>R{(subtotal / 100).toFixed(2)}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-stone-600">
                Delivery and payment are calculated during checkout.
              </p>
              <Link href="/checkout" className="btn-primary mt-6 w-full">Checkout</Link>
              <Link href="/shop" className="btn-secondary mt-3 w-full">Continue shopping</Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
