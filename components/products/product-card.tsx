import Link from "next/link";

type Variant = {
  id: string;
  weight_value: number;
  weight_unit: string;
  retail_price_cents: number;
  stock_quantity: number;
};

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    short_description: string | null;
    heat_level: number;
    product_variants: Variant[] | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const variants = product.product_variants ?? [];
  const cheapest = [...variants].sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0];

  return (
    <Link href={`/spices/${product.slug}`} className="glass-soft group rounded-[2rem] p-5 transition hover:-translate-y-1">
      <div className="mb-6 aspect-[4/3] rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,186,73,.12),transparent_40%),rgba(0,0,0,.2)]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="display-font text-xl font-semibold">{product.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">{product.short_description || "Spice catalogue item"}</p>
        </div>
        <span className="shrink-0 text-xs text-stone-600">Heat {product.heat_level}/5</span>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-stone-500">{variants.length} size{variants.length === 1 ? "" : "s"}</span>
        <span className="font-semibold text-orange-100">{cheapest ? `From R${(cheapest.retail_price_cents / 100).toFixed(2)}` : "No active price"}</span>
      </div>
    </Link>
  );
}
