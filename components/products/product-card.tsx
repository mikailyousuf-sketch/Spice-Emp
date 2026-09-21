import Link from "next/link";
import { addToCart } from "@/app/cart/actions";
import { getProductImageUrl } from "@/lib/products/image-url";

type Variant = {
  id: string;
  weight_value: number;
  weight_unit: string;
  retail_price_cents: number;
  stock_quantity: number;
};

type ProductImage = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
};

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    short_description: string | null;
    heat_level: number;
    product_variants: Variant[] | null;
    product_images: ProductImage[] | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const variants = (product.product_variants ?? []).filter((variant) => variant.stock_quantity > 0);
  const cheapest = [...variants].sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0];
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const image = images[0];
  const imageUrl = getProductImageUrl(image?.storage_path);

  return (
    <article className="group relative text-center">
      <Link href={`/spices/${product.slug}`} className="block">
        <div className="jar-stage">
          <div className="jar-shell">
            <div className="jar-lid" />
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={image?.alt_text || product.name}
                className="jar-image"
              />
            ) : (
              <div className="absolute inset-[10%_0_0] bg-[linear-gradient(180deg,#d5b26f,#8e6a34)] opacity-80" />
            )}
            <div className="jar-label">
              <span className="script-accent block text-[1.65rem] leading-none text-black">
                {product.name}
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.18em] text-neutral-500">
                The Glided Pantry
              </span>
            </div>
            <div className="jar-shine" />
          </div>
        </div>

        <div className="-mt-1">
          <p className="text-xs uppercase tracking-[.18em] text-neutral-400">
            Heat {product.heat_level}/5
          </p>
          <h2 className="display-font mt-2 text-2xl font-semibold">{product.name}</h2>
          <p className="mt-2 text-base font-semibold">
            {cheapest ? `R${(cheapest.retail_price_cents / 100).toFixed(2)}` : "Out of stock"}
          </p>
        </div>
      </Link>

      {cheapest ? (
        <form action={addToCart} className="mt-4 flex justify-center">
          <input type="hidden" name="variantId" value={cheapest.id} />
          <input type="hidden" name="quantity" value="1" />
          <button
            type="submit"
            className="btn-secondary !min-h-10 !px-5 !py-2 text-sm"
          >
            + Quick add
          </button>
        </form>
      ) : null}
    </article>
  );
}
