import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductImageUrl } from "@/lib/products/image-url";
import { createClient } from "@/lib/supabase/server";
import {
  addAlias,
  addVariant,
  deleteAlias,
  deleteProduct,
  deleteProductImage,
  deleteVariant,
  setPrimaryImage,
  updateProduct,
  updateTaxonomy,
  updateVariant,
  uploadProductImage,
  uploadJarRender,
  uploadHeroRender,
  clearVisualRender,
} from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const [
    { data: product },
    { data: productTypes },
    { data: cuisines },
    { data: foodTypes },
    { data: flavours },
    { data: cookingMethods },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id,name,slug,short_description,description,product_type_id,heat_level,is_active,is_featured,jar_render_path,hero_render_path,
        product_variants(id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity,low_stock_threshold,shipping_weight_kg,length_cm,width_cm,height_cm),
        product_aliases(id,alias),
        product_images(id,storage_path,alt_text,is_primary,sort_order),
        product_cuisines(cuisine_id),
        product_food_types(food_type_id),
        product_flavours(flavour_id),
        product_cooking_methods(cooking_method_id)
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("product_types").select("id,name").order("name"),
    supabase.from("cuisines").select("id,name").order("name"),
    supabase.from("food_types").select("id,name").order("name"),
    supabase.from("flavours").select("id,name").order("name"),
    supabase.from("cooking_methods").select("id,name").order("name"),
  ]);

  if (!product) notFound();

  const selectedCuisines = new Set(product.product_cuisines?.map((item) => item.cuisine_id));
  const selectedFoods = new Set(product.product_food_types?.map((item) => item.food_type_id));
  const selectedFlavours = new Set(product.product_flavours?.map((item) => item.flavour_id));
  const selectedMethods = new Set(product.product_cooking_methods?.map((item) => item.cooking_method_id));

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Edit {product.name}</h1>
        </div>
        <Link href={`/spices/${product.slug}`} className="btn-secondary">View product</Link>
      </div>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Changes saved.</p> : null}

      <form action={updateProduct} className="glass-soft mt-8 grid gap-5 rounded-[2rem] p-6 sm:p-8">
        <input type="hidden" name="id" value={product.id} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Product name"><input name="name" defaultValue={product.name} required className="field" /></Field>
          <Field label="Slug"><input name="slug" defaultValue={product.slug} required className="field" /></Field>
        </div>

        <Field label="Short description"><input name="shortDescription" defaultValue={product.short_description ?? ""} className="field" /></Field>
        <Field label="Description"><textarea name="description" defaultValue={product.description ?? ""} rows={5} className="field resize-y" /></Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Product type">
            <select name="productTypeId" defaultValue={product.product_type_id ?? ""} required className="field">
              <option value="">Select type</option>
              {productTypes?.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </Field>
          <Field label="Heat level">
            <select name="heatLevel" defaultValue={String(product.heat_level)} className="field">
              {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n}/5</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="admin-check-row">
            <input type="checkbox" name="isActive" defaultChecked={product.is_active} />
            <span>
              <strong>Active product</strong>
              <small>Visible publicly in the catalogue.</small>
            </span>
          </label>

          <label className="admin-check-row">
            <input type="checkbox" name="isFeatured" defaultChecked={product.is_featured} />
            <span>
              <strong>Featured on homepage</strong>
              <small>The homepage displays up to four featured products.</small>
            </span>
          </label>
        </div>

        <button className="btn-primary w-fit" type="submit">Save product</button>
      </form>

      <section className="glass-soft mt-8 rounded-[2rem] p-6 sm:p-8">
        <div>
          <p className="display-font text-2xl font-semibold">Discovery classification</p>
          <p className="mt-1 text-sm text-stone-500">
            These relationships power cuisine, food, flavour and cooking-method discovery.
          </p>
        </div>

        <form action={updateTaxonomy} className="mt-7 grid gap-7">
          <input type="hidden" name="productId" value={product.id} />
          <TaxonomyGroup name="cuisineIds" label="Cuisines" options={cuisines ?? []} selected={selectedCuisines} />
          <TaxonomyGroup name="foodTypeIds" label="Food types" options={foodTypes ?? []} selected={selectedFoods} />
          <TaxonomyGroup name="flavourIds" label="Flavours" options={flavours ?? []} selected={selectedFlavours} />
          <TaxonomyGroup name="cookingMethodIds" label="Cooking methods" options={cookingMethods ?? []} selected={selectedMethods} />
          <button className="btn-secondary w-fit" type="submit">Save classification</button>
        </form>
      </section>

      <section className="glass-soft mt-8 rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="display-font text-2xl font-semibold">Premium renders</p>
            <p className="mt-1 text-sm text-stone-500">
              Upload the generated jar artwork used across the storefront. These are separate from the normal product gallery.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[.16em] text-stone-500">Jar + hero</span>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <RenderUploader
            title="Catalogue jar render"
            description="Front-facing premium jar for shop cards and collection shelves."
            path={product.jar_render_path}
            productId={product.id}
            action={uploadJarRender}
            field="jar_render_path"
          />
          <RenderUploader
            title="Featured hero render"
            description="Optional editorial render for homepage and feature placements."
            path={product.hero_render_path}
            productId={product.id}
            action={uploadHeroRender}
            field="hero_render_path"
          />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="glass-soft rounded-[2rem] p-6 sm:p-8">
          <p className="display-font text-2xl font-semibold">Search aliases</p>
          <p className="mt-1 text-sm text-stone-500">
            Alternative names like dhana, haldi or common misspellings.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.product_aliases?.map((alias) => (
              <form key={alias.id} action={deleteAlias} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="aliasId" value={alias.id} />
                <span>{alias.alias}</span>
                <button type="submit" className="text-stone-600 hover:text-red-300" aria-label={`Remove ${alias.alias}`}>×</button>
              </form>
            ))}
          </div>

          <form action={addAlias} className="mt-5 flex gap-2">
            <input type="hidden" name="productId" value={product.id} />
            <input name="alias" required minLength={2} placeholder="e.g. dhana" className="field" />
            <button className="btn-secondary shrink-0" type="submit">Add</button>
          </form>
        </section>

        <section className="glass-soft rounded-[2rem] p-6 sm:p-8">
          <p className="display-font text-2xl font-semibold">Product images</p>
          <p className="mt-1 text-sm text-stone-500">
            JPG, PNG, WebP or AVIF, maximum 8MB.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {product.product_images
              ?.slice()
              .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
              .map((image) => {
                const url = getProductImageUrl(image.storage_path);
                return (
                  <div key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    {url ? <img src={url} alt={image.alt_text || product.name} className="aspect-square w-full object-cover" /> : null}
                    <div className="grid gap-2 p-3">
                      <p className="text-xs text-stone-500">{image.is_primary ? "Primary image" : "Gallery image"}</p>
                      {!image.is_primary ? (
                        <form action={setPrimaryImage}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="imageId" value={image.id} />
                          <button className="text-left text-xs text-orange-200" type="submit">Make primary</button>
                        </form>
                      ) : null}
                      <form action={deleteProductImage}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="imageId" value={image.id} />
                        <input type="hidden" name="storagePath" value={image.storage_path} />
                        <input type="hidden" name="wasPrimary" value={String(image.is_primary)} />
                        <button className="text-left text-xs text-red-300" type="submit">Delete image</button>
                      </form>
                    </div>
                  </div>
                );
              })}
          </div>

          <form action={uploadProductImage} className="mt-5 grid gap-3" encType="multipart/form-data">
            <input type="hidden" name="productId" value={product.id} />
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="field" />
            <input name="altText" placeholder="Image description for accessibility" className="field" />
            <button className="btn-secondary w-fit" type="submit">Upload image</button>
          </form>
        </section>
      </div>

      <section className="glass-soft mt-8 rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="display-font text-2xl font-semibold">Variants</p>
            <p className="mt-1 text-sm text-stone-500">Manage pack sizes, prices and stock.</p>
          </div>
          <span className="text-sm text-stone-500">{product.product_variants?.length ?? 0} total</span>
        </div>

        <div className="mt-6 grid gap-3">
          {product.product_variants?.map((variant) => (
            <form
              key={variant.id}
              action={updateVariant}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
            >
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="variantId" value={variant.id} />
              <Field label="SKU"><input name="sku" defaultValue={variant.sku} required className="field" /></Field>
              <Field label="Weight">
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <input name="weightValue" type="number" min="0.001" step="0.001" defaultValue={variant.weight_value} required className="field" />
                  <select name="weightUnit" defaultValue={variant.weight_unit} className="field">
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </Field>
              <Field label="Retail price (R)">
                <input
                  name="retailPriceRand"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={(variant.retail_price_cents / 100).toFixed(2)}
                  required
                  className="field"
                />
              </Field>
              <Field label="Stock">
                <input name="stockQuantity" type="number" min="0" step="0.001" defaultValue={variant.stock_quantity} required className="field" />
              </Field>
              <Field label="Low stock at">
                <input name="lowStockThreshold" type="number" min="0" step="0.001" defaultValue={variant.low_stock_threshold} required className="field" />
              </Field>
              <Field label="Shipping weight (kg)">
                <input name="shippingWeightKg" type="number" min="0.001" step="0.001" defaultValue={variant.shipping_weight_kg ?? ""} required className="field" />
              </Field>
              <Field label="Length (cm)">
                <input name="lengthCm" type="number" min="0.1" step="0.1" defaultValue={variant.length_cm ?? ""} required className="field" />
              </Field>
              <Field label="Width (cm)">
                <input name="widthCm" type="number" min="0.1" step="0.1" defaultValue={variant.width_cm ?? ""} required className="field" />
              </Field>
              <Field label="Height (cm)">
                <input name="heightCm" type="number" min="0.1" step="0.1" defaultValue={variant.height_cm ?? ""} required className="field" />
              </Field>
              <div className="flex items-end gap-2">
                <button className="btn-secondary !min-h-11 !px-4 !py-2 text-sm" type="submit">Save</button>
                <button
                  formAction={deleteVariant}
                  className="min-h-11 rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10"
                  type="submit"
                >
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>

        <form action={addVariant} className="mt-8 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-2">
          <input type="hidden" name="productId" value={product.id} />
          <Field label="SKU"><input name="sku" required className="field" /></Field>
          <Field label="Weight">
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input name="weightValue" type="number" min="0.001" step="0.001" required className="field" />
              <select name="weightUnit" defaultValue="g" className="field"><option value="g">g</option><option value="kg">kg</option></select>
            </div>
          </Field>
          <Field label="Retail price (R)"><input name="retailPriceRand" type="number" min="0" step="0.01" required className="field" /></Field>
          <Field label="Stock quantity"><input name="stockQuantity" type="number" min="0" step="0.001" defaultValue="0" required className="field" /></Field>
          <Field label="Low stock threshold"><input name="lowStockThreshold" type="number" min="0" step="0.001" defaultValue="0" required className="field" /></Field>
          <Field label="Shipping weight (kg)"><input name="shippingWeightKg" type="number" min="0.001" step="0.001" required className="field" /></Field>
          <Field label="Length (cm)"><input name="lengthCm" type="number" min="0.1" step="0.1" required className="field" /></Field>
          <Field label="Width (cm)"><input name="widthCm" type="number" min="0.1" step="0.1" required className="field" /></Field>
          <Field label="Height (cm)"><input name="heightCm" type="number" min="0.1" step="0.1" required className="field" /></Field>
          <button className="btn-secondary w-fit md:col-span-2" type="submit">Add variant</button>
        </form>
      </section>

      <section className="mt-8 rounded-[2rem] border border-red-400/15 bg-red-400/[.04] p-6">
        <p className="display-font text-xl font-semibold">Danger zone</p>
        <p className="mt-2 text-sm text-stone-500">Deleting a product also removes its variants, taxonomy relationships, aliases and image records.</p>
        <form action={deleteProduct} className="mt-5">
          <input type="hidden" name="productId" value={product.id} />
          <button type="submit" className="rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">
            Delete product
          </button>
        </form>
      </section>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm"><span className="text-stone-300">{label}</span>{children}</label>;
}

function TaxonomyGroup({
  name,
  label,
  options,
  selected,
}: {
  name: string;
  label: string;
  options: Array<{ id: string; name: string }>;
  selected: Set<string>;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-stone-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.id} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={option.id}
              defaultChecked={selected.has(option.id)}
              className="peer sr-only"
            />
            <span className="block rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-sm text-stone-400 transition peer-checked:border-orange-300/30 peer-checked:bg-orange-300/10 peer-checked:text-orange-100">
              {option.name}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}


function RenderUploader({
  title,
  description,
  path,
  productId,
  action,
  field,
}: {
  title: string;
  description: string;
  path: string | null;
  productId: string;
  action: (formData: FormData) => Promise<void>;
  field: "jar_render_path" | "hero_render_path";
}) {
  const url = getProductImageUrl(path);

  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {url ? (
          <img src={url} alt="" className="aspect-[4/5] w-full object-contain" />
        ) : (
          <div className="grid aspect-[4/5] place-items-center text-center text-sm text-stone-600">
            No render uploaded yet
          </div>
        )}
      </div>
      <p className="mt-4 font-semibold text-stone-200">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>

      <form action={action} encType="multipart/form-data" className="mt-4 grid gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input name="render" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="field" />
        <button type="submit" className="btn-secondary w-fit">{url ? "Replace render" : "Upload render"}</button>
      </form>

      {url ? (
        <form action={clearVisualRender} className="mt-3">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="field" value={field} />
          <button type="submit" className="text-xs text-red-300">Remove render</button>
        </form>
      ) : null}
    </div>
  );
}
