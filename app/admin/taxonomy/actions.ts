"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const tableSchema = z.enum([
  "product_types",
  "cuisines",
  "food_types",
  "flavours",
  "cooking_methods",
]);

const itemSchema = z.object({
  table: tableSchema,
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

function taxonomyUrl(message?: string) {
  return message
    ? `/admin/taxonomy?error=${encodeURIComponent(message)}`
    : "/admin/taxonomy?saved=1";
}

export async function createTaxonomyItem(formData: FormData) {
  await requireAdmin();

  const parsed = itemSchema.safeParse({
    table: formData.get("table"),
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    redirect(taxonomyUrl("Please check the taxonomy name and slug."));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(parsed.data.table)
    .insert({ name: parsed.data.name, slug: parsed.data.slug });

  if (error) {
    redirect(taxonomyUrl(error.message));
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products/new");
  redirect(taxonomyUrl());
}

export async function deleteTaxonomyItem(formData: FormData) {
  await requireAdmin();

  const table = tableSchema.parse(formData.get("table"));
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    redirect(taxonomyUrl(error.message));
  }

  revalidatePath("/shop");
  redirect(taxonomyUrl());
}
