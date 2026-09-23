import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateCart } from "@/lib/cart";

const schema = z.object({
  variantIds: z.array(z.string().uuid()).min(1).max(12),
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "No valid products were selected." }, { status: 400 });
  }

  const uniqueIds = [...new Set(parsed.data.variantIds)];
  const admin = createAdminClient();

  const { data: variants, error: variantError } = await admin
    .from("product_variants")
    .select("id,is_active,stock_quantity,products(id,is_active)")
    .in("id", uniqueIds);

  if (variantError) {
    return NextResponse.json({ error: variantError.message }, { status: 500 });
  }

  const valid = (variants ?? []).filter((variant) => {
    const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
    return variant.is_active && product?.is_active && Number(variant.stock_quantity) > 0;
  });

  if (!valid.length) {
    return NextResponse.json({ error: "Those pantry items are no longer available." }, { status: 409 });
  }

  const cart = await getOrCreateCart();

  const { data: existingItems } = await admin
    .from("cart_items")
    .select("id,variant_id,quantity")
    .eq("cart_id", cart.id)
    .in("variant_id", valid.map((variant) => variant.id));

  const existingByVariant = new Map(
    (existingItems ?? []).map((item) => [item.variant_id, item]),
  );

  let added = 0;

  for (const variant of valid) {
    const existing = existingByVariant.get(variant.id);
    const nextQuantity = Number(existing?.quantity ?? 0) + 1;

    if (nextQuantity > Number(variant.stock_quantity)) continue;

    const { error } = existing
      ? await admin
          .from("cart_items")
          .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
      : await admin
          .from("cart_items")
          .insert({ cart_id: cart.id, variant_id: variant.id, quantity: 1 });

    if (!error) added += 1;
  }

  if (!added) {
    return NextResponse.json(
      { error: "Nothing could be added. Check available stock in your cart." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    added,
    requested: uniqueIds.length,
  });
}
