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
  isFeatured: z.coerce.boolean(),
  sku: z.string().trim().min(2).max(100),
  weightValue: z.coerce.number().positive(),
  weightUnit: z.enum(["g", "kg"]),
  retailPriceRand: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().nonnegative(),
  lowStockThreshold: z.coerce.number().nonnegative(),
  shippingWeightKg: z.coerce.number().positive(),
  lengthCm: z.coerce.number().positive(),
  widthCm: z.coerce.number().positive(),
  heightCm: z.coerce.number().positive(),
});

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const primaryImage = formData.get("primaryImage");
  const hasPrimaryImage = primaryImage instanceof File && primaryImage.size > 0;

  if (hasPrimaryImage && primaryImage.size > 8 * 1024 * 1024) {
    redirect("/admin/products/new?error=Product%20images%20must%20be%208MB%20or%20smaller.");
  }

  const primaryImageExtension = hasPrimaryImage ? imageTypes.get(primaryImage.type) : undefined;

  if (hasPrimaryImage && !primaryImageExtension) {
    redirect("/admin/products/new?error=Use%20a%20JPG%2C%20PNG%2C%20WebP%20or%20AVIF%20image.");
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    productTypeId: formData.get("productTypeId"),
    heatLevel: formData.get("heatLevel"),
    isFeatured: formData.get("isFeatured") === "on",
    sku: formData.get("sku"),
    weightValue: formData.get("weightValue"),
    weightUnit: formData.get("weightUnit"),
    retailPriceRand: formData.get("retailPriceRand"),
    stockQuantity: formData.get("stockQuantity"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    shippingWeightKg: formData.get("shippingWeightKg"),
    lengthCm: formData.get("lengthCm"),
    widthCm: formData.get("widthCm"),
    heightCm: formData.get("heightCm"),
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
      is_featured: parsed.data.isFeatured,
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
    shipping_weight_kg: parsed.data.shippingWeightKg,
    length_cm: parsed.data.lengthCm,
    width_cm: parsed.data.widthCm,
    height_cm: parsed.data.heightCm,
  });

  if (variantError) {
    await supabase.from("products").delete().eq("id", product.id);
    redirect(`/admin/products/new?error=${encodeURIComponent(variantError.message)}`);
  }

  if (hasPrimaryImage && primaryImageExtension) {
    const storagePath = `${product.id}/${crypto.randomUUID()}.${primaryImageExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, primaryImage, {
        contentType: primaryImage.type,
        upsert: false,
      });

    if (uploadError) {
      await supabase.from("products").delete().eq("id", product.id);
      redirect(`/admin/products/new?error=${encodeURIComponent(`Image upload failed: ${uploadError.message}`)}`);
    }

    const { error: imageRowError } = await supabase.from("product_images").insert({
      product_id: product.id,
      storage_path: storagePath,
      alt_text: String(formData.get("imageAltText") || "").trim() || parsed.data.name,
      is_primary: true,
      sort_order: 0,
    });

    if (imageRowError) {
      await supabase.storage.from("product-images").remove([storagePath]);
      await supabase.from("products").delete().eq("id", product.id);
      redirect(`/admin/products/new?error=${encodeURIComponent(`Image record failed: ${imageRowError.message}`)}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}?created=1`);
}
