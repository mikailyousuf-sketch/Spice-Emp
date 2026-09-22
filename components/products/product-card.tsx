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
    jar_render_path?: string | null;
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
  const jarRenderUrl = getProductImageUrl(product.jar_render_path ?? null);
  const displayUrl = imageUrl || jarRenderUrl;

  return (
    <article className="shelf-product group">
      <Link href={`/spices/${product.slug}`} className="block">
        <div className="shelf-product-image has-real-photo">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={image?.alt_text || product.name}
              className="product-card-photo"
            />
          ) : (
            <div className="product-card-empty" aria-label={`No image uploaded for ${product.name}`}>
              <img src="/branding/glided-monogram.svg" alt="" />
              <span>Image not uploaded</span>
            </div>
          )}
        </div>

        <div className="shelf-product-meta">
          <h2>{product.name}</h2>
          <p>{cheapest ? `R${(cheapest.retail_price_cents / 100).toFixed(2)}` : "Out of stock"}</p>
        </div>
      </Link>

      {cheapest ? (
        <form action={addToCart} className="mt-3">
          <input type="hidden" name="variantId" value={cheapest.id} />
          <input type="hidden" name="quantity" value="1" />
          <button className="shelf-quick-add" type="submit">
            Quick add <span aria-hidden="true">＋</span>
          </button>
        </form>
      ) : null}
    </article>
  );
}
