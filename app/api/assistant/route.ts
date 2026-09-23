import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductImageUrl } from "@/lib/products/image-url";

const requestSchema = z.object({
  query: z.string().trim().min(2).max(1000),
  refinements: z.object({
    heat: z.enum(["mild","medium","hot"]).optional(),
    diet: z.enum(["meat","vegetarian"]).optional(),
    cuisine: z.string().trim().max(80).optional(),
  }).optional(),
});

const stopWords = new Set([
  "a","an","and","are","for","i","im","in","is","it","make","making","me","my",
  "of","on","or","please","some","the","to","want","with","would","like","cook",
  "cooking","need","something","what","should","can","you","give","using"
]);

function tokens(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 1 && !stopWords.has(token)),
    ),
  );
}

function namesFromRelation(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const values = Object.values(item as Record<string, unknown>);
    return values.flatMap((nested) => {
      if (Array.isArray(nested)) {
        return nested.flatMap((row) =>
          row && typeof row === "object" && "name" in row
            ? [String((row as { name: unknown }).name)]
            : [],
        );
      }
      if (nested && typeof nested === "object" && "name" in nested) {
        return [String((nested as { name: unknown }).name)];
      }
      return [];
    });
  });
}

function cheapestInStock(variants: Array<{
  id: string;
  retail_price_cents: number;
  stock_quantity: number;
  weight_value: number;
  weight_unit: string;
}> | null | undefined) {
  return [...(variants ?? [])]
    .filter((variant) => Number(variant.stock_quantity) > 0)
    .sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0];
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tell us what you're cooking." }, { status: 400 });
  }

  const query = parsed.data.query;
  const refinements = parsed.data.refinements ?? {};
  const refinementText = [
    refinements.heat,
    refinements.diet,
    refinements.cuisine,
  ].filter(Boolean).join(" ");
  const enrichedQuery = [query, refinementText].filter(Boolean).join(" ");
  const queryLower = enrichedQuery.toLowerCase();
  const queryTokens = tokens(enrichedQuery);

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,name,slug,short_description,description,heat_level,jar_render_path,
      product_variants(id,retail_price_cents,stock_quantity,weight_value,weight_unit),
      product_images(id,storage_path,alt_text,is_primary,sort_order),
      product_aliases(alias),
      product_cuisines(cuisines(name)),
      product_food_types(food_types(name)),
      product_flavours(flavours(name)),
      product_cooking_methods(cooking_methods(name))
    `)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: "The pantry could not be searched right now." }, { status: 500 });
  }

  const heatIntent =
    /\b(very hot|extra hot|fiery|spicy)\b/.test(queryLower) ? 4 :
    /\b(hot|heat)\b/.test(queryLower) ? 3 :
    /\b(mild|gentle|not spicy)\b/.test(queryLower) ? 1 :
    null;

  const scored = (products ?? []).map((product) => {
    const aliases = (product.product_aliases ?? []).map((item) => item.alias);
    const cuisines = namesFromRelation(product.product_cuisines);
    const foodTypes = namesFromRelation(product.product_food_types);
    const flavours = namesFromRelation(product.product_flavours);
    const methods = namesFromRelation(product.product_cooking_methods);

    const fields = [
      { label: "name", values: [product.name], weight: 8 },
      { label: "alias", values: aliases, weight: 7 },
      { label: "cuisine", values: cuisines, weight: 5 },
      { label: "food", values: foodTypes, weight: 5 },
      { label: "flavour", values: flavours, weight: 4 },
      { label: "method", values: methods, weight: 4 },
      { label: "description", values: [product.short_description ?? "", product.description ?? ""], weight: 2 },
    ];

    let score = 0;
    const matched = new Set<string>();

    for (const field of fields) {
      for (const rawValue of field.values) {
        const value = rawValue.toLowerCase();
        if (!value) continue;

        if (queryLower.includes(value) || value.includes(queryLower)) {
          score += field.weight * 2;
          if (field.label !== "description") matched.add(rawValue);
        }

        for (const token of queryTokens) {
          if (value.includes(token)) {
            score += field.weight;
            if (field.label !== "description") matched.add(rawValue);
          }
        }
      }
    }

    if (heatIntent !== null) {
      const distance = Math.abs(Number(product.heat_level) - heatIntent);
      score += Math.max(0, 4 - distance);
    }

    const variants = product.product_variants ?? [];
    const inStock = variants.some((variant) => Number(variant.stock_quantity) > 0);
    if (inStock) score += 2;

    const images = [...(product.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );
    const image = images[0];
    const imageUrl = getProductImageUrl(image?.storage_path)
      || getProductImageUrl(product.jar_render_path ?? null);
    const cheapest = cheapestInStock(variants);

    const why =
      matched.size > 0
        ? `Matches ${Array.from(matched).slice(0, 3).join(", ")} in the live pantry.`
        : heatIntent !== null
          ? `Its heat profile is close to what you asked for.`
          : `Available now and relevant to your cooking prompt.`;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.short_description,
      heatLevel: product.heat_level,
      imageUrl,
      imageAlt: image?.alt_text || product.name,
      priceCents: cheapest?.retail_price_cents ?? null,
      variantId: cheapest?.id ?? null,
      variantLabel: cheapest ? `${cheapest.weight_value}${cheapest.weight_unit}` : null,
      inStock,
      matched: Array.from(matched).slice(0, 4),
      why,
      score,
    };
  });

  const ranked = scored
    .filter((item) => item.score > 2)
    .sort((a, b) => b.score - a.score || Number(b.inStock) - Number(a.inStock))
    .slice(0, 6);

  const fallback = ranked.length
    ? ranked
    : scored
        .filter((item) => item.inStock)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 4);

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;
  const admin = createAdminClient();

  await admin.from("assistant_queries").insert({
    user_id: userId,
    query_text: query,
    result_count: fallback.length,
    strong_match: ranked.length > 0,
    top_product_ids: fallback.slice(0, 6).map((item) => item.id),
    refinement_context: refinements,
  });

  return NextResponse.json({
    query,
    recommendations: fallback,
    exactMatchFound: ranked.length > 0,
    note: ranked.length
      ? "Matched only against products and classifications in the live pantry."
      : "No strong catalogue match yet, so these are currently available pantry items.",
    refinements: [
      { key: "mild", label: "Make it mild" },
      { key: "hot", label: "Make it hotter" },
      { key: "meat", label: "Meat dish" },
      { key: "vegetarian", label: "Vegetarian" },
    ],
  });
}
