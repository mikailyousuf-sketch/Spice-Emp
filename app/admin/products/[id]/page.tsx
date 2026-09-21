import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addVariant, deleteProduct, deleteVariant, updateProduct } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const [{ data: product }, { data: productTypes }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,slug,short_description,description,product_type_id,heat_level,is_active,product_variants(id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("product_types").select("id,name").order("name"),
  ]);

  if (!product) notFound();

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

        <label className="flex items-center gap-3 text-sm text-stone-300">
          <input type="checkbox" name="isActive" defaultChecked={product.is_active} />
          Product is active and visible publicly
        </label>

        <button className="btn-primary w-fit" type="submit">Save product</button>
      </form>

      <div className="mt-8 grid gap-6">
        <section className="glass-soft rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="display-font text-2xl font-semibold">Variants</p>
              <p className="mt-1 text-sm text-stone-500">Manage pack sizes, prices and stock.</p>
            </div>
            <span className="text-sm text-stone-500">{product.product_variants?.length ?? 0} total</span>
          </div>

          <div className="mt-6 grid gap-3">
            {product.product_variants?.map((variant) => (
              <div key={variant.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div>
                  <p className="font-semibold">{variant.weight_value}{variant.weight_unit}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {variant.sku} · R{(variant.retail_price_cents / 100).toFixed(2)} · stock {variant.stock_quantity}
                  </p>
                </div>
                <form action={deleteVariant}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="variantId" value={variant.id} />
                  <button type="submit" className="text-sm text-red-300 hover:text-red-200">Delete</button>
                </form>
              </div>
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
            <button className="btn-secondary w-fit md:col-span-2" type="submit">Add variant</button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-red-400/15 bg-red-400/[.04] p-6">
          <p className="display-font text-xl font-semibold">Danger zone</p>
          <p className="mt-2 text-sm text-stone-500">Deleting a product also removes its variants and relationships.</p>
          <form action={deleteProduct} className="mt-5">
            <input type="hidden" name="productId" value={product.id} />
            <button type="submit" className="rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">
              Delete product
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm"><span className="text-stone-300">{label}</span>{children}</label>;
}
