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
  lowStockThreshold: z.coerce.number().nonnegative(),
});

const taxonomySchema = z.object({
  productId: z.string().uuid(),
  cuisineIds: z.array(z.string().uuid()),
  foodTypeIds: z.array(z.string().uuid()),
  flavourIds: z.array(z.string().uuid()),
  cookingMethodIds: z.array(z.string().uuid()),
});

function productAdminUrl(productId: string, message?: string) {
  const suffix = message ? `?error=${encodeURIComponent(message)}` : "?saved=1";
  return `/admin/products/${productId}${suffix}`;
}

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
    redirect(productAdminUrl(parsed.data.id, error.message));
  }

  revalidatePath("/shop");
  revalidatePath(`/spices/${parsed.data.slug}`);
  revalidatePath("/admin/products");
  redirect(productAdminUrl(parsed.data.id));
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
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    redirect(productAdminUrl(String(formData.get("productId")), "Please check the variant details."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").insert({
    product_id: parsed.data.productId,
    sku: parsed.data.sku,
    weight_value: parsed.data.weightValue,
    weight_unit: parsed.data.weightUnit,
    retail_price_cents: Math.round(parsed.data.retailPriceRand * 100),
    stock_quantity: parsed.data.stockQuantity,
    low_stock_threshold: parsed.data.lowStockThreshold,
  });

  if (error) {
    redirect(productAdminUrl(parsed.data.productId, error.message));
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect(productAdminUrl(parsed.data.productId));
}

export async function updateVariant(formData: FormData) {
  await requireAdmin();

  const parsed = variantSchema.extend({
    variantId: z.string().uuid(),
  }).safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
    sku: formData.get("sku"),
    weightValue: formData.get("weightValue"),
    weightUnit: formData.get("weightUnit"),
    retailPriceRand: formData.get("retailPriceRand"),
    stockQuantity: formData.get("stockQuantity"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    redirect(productAdminUrl(String(formData.get("productId")), "Please check the variant details."));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_variants")
    .update({
      sku: parsed.data.sku,
      weight_value: parsed.data.weightValue,
      weight_unit: parsed.data.weightUnit,
      retail_price_cents: Math.round(parsed.data.retailPriceRand * 100),
      stock_quantity: parsed.data.stockQuantity,
      low_stock_threshold: parsed.data.lowStockThreshold,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.variantId)
    .eq("product_id", parsed.data.productId);

  if (error) {
    redirect(productAdminUrl(parsed.data.productId, error.message));
  }

  revalidatePath("/shop");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  redirect(productAdminUrl(parsed.data.productId));
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const variantId = z.string().uuid().parse(formData.get("variantId"));

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);

  if (error) {
    redirect(productAdminUrl(productId, error.message));
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect(productAdminUrl(productId));
}

export async function updateTaxonomy(formData: FormData) {
  await requireAdmin();

  const parsed = taxonomySchema.safeParse({
    productId: formData.get("productId"),
    cuisineIds: formData.getAll("cuisineIds"),
    foodTypeIds: formData.getAll("foodTypeIds"),
    flavourIds: formData.getAll("flavourIds"),
    cookingMethodIds: formData.getAll("cookingMethodIds"),
  });

  if (!parsed.success) {
    redirect(productAdminUrl(String(formData.get("productId")), "Invalid taxonomy selection."));
  }

  const supabase = await createClient();
  const productId = parsed.data.productId;

  const tables = [
    ["product_cuisines", "cuisine_id", parsed.data.cuisineIds],
    ["product_food_types", "food_type_id", parsed.data.foodTypeIds],
    ["product_flavours", "flavour_id", parsed.data.flavourIds],
    ["product_cooking_methods", "cooking_method_id", parsed.data.cookingMethodIds],
  ] as const;

  for (const [table, foreignKey, ids] of tables) {
    const { error: deleteError } = await supabase.from(table).delete().eq("product_id", productId);

    if (deleteError) {
      redirect(productAdminUrl(productId, deleteError.message));
    }

    if (ids.length) {
      const { error: insertError } = await supabase
        .from(table)
        .insert(ids.map((id) => ({ product_id: productId, [foreignKey]: id })));

      if (insertError) {
        redirect(productAdminUrl(productId, insertError.message));
      }
    }
  }

  revalidatePath("/shop");
  redirect(productAdminUrl(productId));
}

export async function addAlias(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const alias = z.string().trim().min(2).max(100).parse(formData.get("alias"));
  const supabase = await createClient();

  const { error } = await supabase.from("product_aliases").insert({
    product_id: productId,
    alias,
  });

  if (error) {
    redirect(productAdminUrl(productId, error.message));
  }

  redirect(productAdminUrl(productId));
}

export async function deleteAlias(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const aliasId = z.string().uuid().parse(formData.get("aliasId"));
  const supabase = await createClient();

  const { error } = await supabase.from("product_aliases").delete().eq("id", aliasId);

  if (error) {
    redirect(productAdminUrl(productId, error.message));
  }

  redirect(productAdminUrl(productId));
}

export async function uploadProductImage(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    redirect(productAdminUrl(productId, "Choose an image to upload."));
  }

  if (file.size > 5 * 1024 * 1024) {
    redirect(productAdminUrl(productId, "Images must be 5MB or smaller."));
  }

  const allowed = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/avif", "avif"],
  ]);

  const extension = allowed.get(file.type);

  if (!extension) {
    redirect(productAdminUrl(productId, "Use a JPG, PNG, WebP or AVIF image."));
  }

  const supabase = await createClient();
  const storagePath = `${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    redirect(productAdminUrl(productId, uploadError.message));
  }

  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error: rowError } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    alt_text: String(formData.get("altText") || "").trim() || null,
    is_primary: (count ?? 0) === 0,
    sort_order: count ?? 0,
  });

  if (rowError) {
    await supabase.storage.from("product-images").remove([storagePath]);
    redirect(productAdminUrl(productId, rowError.message));
  }

  revalidatePath("/shop");
  redirect(productAdminUrl(productId));
}

export async function setPrimaryImage(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const imageId = z.string().uuid().parse(formData.get("imageId"));
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  if (clearError) {
    redirect(productAdminUrl(productId, clearError.message));
  }

  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    redirect(productAdminUrl(productId, error.message));
  }

  revalidatePath("/shop");
  redirect(productAdminUrl(productId));
}

export async function deleteProductImage(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const imageId = z.string().uuid().parse(formData.get("imageId"));
  const storagePath = z.string().min(1).parse(formData.get("storagePath"));
  const wasPrimary = formData.get("wasPrimary") === "true";

  const supabase = await createClient();

  const { error: storageError } = await supabase.storage
    .from("product-images")
    .remove([storagePath]);

  if (storageError) {
    redirect(productAdminUrl(productId, storageError.message));
  }

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);

  if (error) {
    redirect(productAdminUrl(productId, error.message));
  }

  if (wasPrimary) {
    const { data: nextImage } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("sort_order")
      .limit(1)
      .maybeSingle();

    if (nextImage) {
      await supabase.from("product_images").update({ is_primary: true }).eq("id", nextImage.id);
    }
  }

  revalidatePath("/shop");
  redirect(productAdminUrl(productId));
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const productId = z.string().uuid().parse(formData.get("productId"));
  const supabase = await createClient();

  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);

  if (images?.length) {
    await supabase.storage
      .from("product-images")
      .remove(images.map((image) => image.storage_path));
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    redirect(productAdminUrl(productId, error.message));
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}
