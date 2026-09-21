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
  const variants = (product.product_variants ?? []).filter(v => v.stock_quantity > 0);
  const cheapest = [...variants].sort((a,b) => a.retail_price_cents - b.retail_price_cents)[0];
  const images = [...(product.product_images ?? [])].sort(
    (a,b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const image = images[0];
  const imageUrl = getProductImageUrl(image?.storage_path);

  return (
    <article className="product-card group">
      <Link href={`/spices/${product.slug}`} className="block">
        <div className="product-visual">
          <div className="product-plinth" />
          <div className="product-jar">
            <div className="jar-lid" />
            {imageUrl ? <img src={imageUrl} alt={image?.alt_text || product.name} className="jar-image" /> : <div className="jar-fallback" />}
            <div className="jar-label">
              <span className="jar-label-brand">The Glided Pantry</span>
              <span className="jar-label-name">{product.name}</span>
            </div>
          </div>
        </div>
        <h2 className="product-name">{product.name}</h2>
        <p className="product-price">{cheapest ? `R${(cheapest.retail_price_cents/100).toFixed(2)}` : "Out of stock"}</p>
      </Link>
      {cheapest ? (
        <form action={addToCart}>
          <input type="hidden" name="variantId" value={cheapest.id} />
          <input type="hidden" name="quantity" value="1" />
          <button className="quick-add" type="submit">Add to cart</button>
        </form>
      ) : null}
    </article>
  );
}
