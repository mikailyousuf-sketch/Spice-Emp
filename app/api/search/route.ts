import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const admin = createAdminClient();

  const [{ data: fuzzy }, { data: claimsData }] = await Promise.all([
    supabase.rpc("search_catalogue", { search_term: q, result_limit: 8 }),
    supabase.auth.getClaims(),
  ]);

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

  const userId = claimsData?.claims?.sub ?? null;
  await admin.from("product_searches").insert({
    user_id: userId,
    query_text: q,
    result_count: results.length,
  });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentSearches } = await admin
    .from("product_searches")
    .select("query_text")
    .gte("created_at", since)
    .limit(500);

  const counts = new Map<string, number>();
  for (const row of recentSearches ?? []) {
    const value = String(row.query_text || "").trim().toLowerCase();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const trending = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([query]) => query);

  return NextResponse.json({ results, trending });
}
