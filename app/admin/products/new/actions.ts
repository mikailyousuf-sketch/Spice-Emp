"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  productTypeId: z.string().uuid(),
  heatLevel: z.coerce.number().int().min(0).max(5),
  sku: z.string().trim().min(2).max(100),
  weightValue: z.coerce.number().positive(),
  weightUnit: z.enum(["g", "kg"]),
  retailPriceRand: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().nonnegative(),
  lowStockThreshold: z.coerce.number().nonnegative(),
});

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    productTypeId: formData.get("productTypeId"),
    heatLevel: formData.get("heatLevel"),
    sku: formData.get("sku"),
    weightValue: formData.get("weightValue"),
    weightUnit: formData.get("weightUnit"),
    retailPriceRand: formData.get("retailPriceRand"),
    stockQuantity: formData.get("stockQuantity"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    redirect("/admin/products/new?error=Please%20check%20the%20product%20details.");
  }

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription ?? null,
      description: parsed.data.description ?? null,
      product_type_id: parsed.data.productTypeId,
      heat_level: parsed.data.heatLevel,
    })
    .select("id")
    .single();

  if (productError || !product) {
    redirect(`/admin/products/new?error=${encodeURIComponent(productError?.message ?? "Could not create product.")}`);
  }

  const { error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id,
    sku: parsed.data.sku,
    weight_value: parsed.data.weightValue,
    weight_unit: parsed.data.weightUnit,
    retail_price_cents: Math.round(parsed.data.retailPriceRand * 100),
    stock_quantity: parsed.data.stockQuantity,
    low_stock_threshold: parsed.data.lowStockThreshold,
  });

  if (variantError) {
    await supabase.from("products").delete().eq("id", product.id);
    redirect(`/admin/products/new?error=${encodeURIComponent(variantError.message)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
