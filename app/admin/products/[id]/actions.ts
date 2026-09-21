"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  productTypeId: z.string().uuid(),
  heatLevel: z.coerce.number().int().min(0).max(5),
  isActive: z.coerce.boolean(),
});

const variantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().trim().min(2).max(100),
  weightValue: z.coerce.number().positive(),
  weightUnit: z.enum(["g", "kg"]),
  retailPriceRand: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().nonnegative(),
});

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    productTypeId: formData.get("productTypeId"),
    heatLevel: formData.get("heatLevel"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    redirect(`/admin/products/${formData.get("id")}?error=Please%20check%20the%20product%20details.`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription ?? null,
      description: parsed.data.description ?? null,
      product_type_id: parsed.data.productTypeId,
      heat_level: parsed.data.heatLevel,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/admin/products/${parsed.data.id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/shop");
  revalidatePath(`/spices/${parsed.data.slug}`);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${parsed.data.id}?saved=1`);
}

export async function addVariant(formData: FormData) {
  await requireAdmin();

  const parsed = variantSchema.safeParse({
    productId: formData.get("productId"),
    sku: formData.get("sku"),
    weightValue: formData.get("weightValue"),
    weightUnit: formData.get("weightUnit"),
    retailPriceRand: formData.get("retailPriceRand"),
    stockQuantity: formData.get("stockQuantity"),
  });

  if (!parsed.success) {
    redirect(`/admin/products/${formData.get("productId")}?error=Please%20check%20the%20variant%20details.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").insert({
    product_id: parsed.data.productId,
    sku: parsed.data.sku,
    weight_value: parsed.data.weightValue,
    weight_unit: parsed.data.weightUnit,
    retail_price_cents: Math.round(parsed.data.retailPriceRand * 100),
    stock_quantity: parsed.data.stockQuantity,
  });

  if (error) {
    redirect(`/admin/products/${parsed.data.productId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${parsed.data.productId}?saved=1`);
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const variantId = z.string().uuid().parse(formData.get("variantId"));

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);

  if (error) {
    redirect(`/admin/products/${productId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    redirect(`/admin/products/${productId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}
