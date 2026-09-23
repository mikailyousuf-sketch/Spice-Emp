import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProductImageUrl } from "@/lib/products/image-url";

const schema = z.object({
  q: z.string().trim().min(1).max(160),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({ q: url.searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ results: [], trending: [] });
  }

  const q = parsed.data.q;
  const supabase = await createClient();

  const { data: fuzzy } = await supabase.rpc("search_catalogue", {
    search_term: q,
    result_limit: 8,
  });

  const ids = (fuzzy ?? []).map((row: { product_id: string }) => row.product_id);
  const scoreMap = new Map(
    (fuzzy ?? []).map((row: { product_id: string; score: number }) => [
      row.product_id,
      Number(row.score),
    ]),
  );

  let products: any[] = [];

  if (ids.length) {
    const { data } = await supabase
      .from("products")
      .select(`
        id,name,slug,short_description,heat_level,jar_render_path,
        product_variants(id,retail_price_cents,stock_quantity,weight_value,weight_unit),
        product_images(storage_path,alt_text,is_primary,sort_order)
      `)
      .in("id", ids)
      .eq("is_active", true);

    products = (data ?? []).sort(
      (a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0),
    );
  }

  const results = products.map((product) => {
    const variants = [...(product.product_variants ?? [])]
      .filter((variant) => Number(variant.stock_quantity) > 0)
      .sort((a, b) => a.retail_price_cents - b.retail_price_cents);

    const images = [...(product.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );

    const image = images[0];
    const cheapest = variants[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.short_description,
      heatLevel: product.heat_level,
      imageUrl: getProductImageUrl(image?.storage_path)
        || getProductImageUrl(product.jar_render_path ?? null),
      imageAlt: image?.alt_text || product.name,
      priceCents: cheapest?.retail_price_cents ?? null,
      variantLabel: cheapest
        ? `${cheapest.weight_value}${cheapest.weight_unit}`
        : null,
      score: scoreMap.get(product.id) ?? 0,
    };
  });

  const trending: string[] = [];

  return NextResponse.json({ results, trending });
}
