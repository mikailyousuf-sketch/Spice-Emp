import { createClient } from "@/lib/supabase/server";
import { createProduct } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };
export const metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: productTypes } = await supabase.from("product_types").select("id,name").order("name");

  return (
    <section>
      <span className="eyebrow">Catalogue</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Add product</h1>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}

      <form action={createProduct} encType="multipart/form-data" className="glass-soft mt-8 grid gap-5 rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Product name"><input name="name" required className="field" /></Field>
          <Field label="Slug"><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="ground-cumin" className="field" /></Field>
        </div>

        <Field label="Short description"><input name="shortDescription" maxLength={300} className="field" /></Field>
        <Field label="Description"><textarea name="description" rows={5} className="field resize-y" /></Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Product type">
            <select name="productTypeId" required className="field">
              <option value="">Select type</option>
              {productTypes?.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </Field>
          <Field label="Heat level">
            <select name="heatLevel" defaultValue="0" className="field">
              {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n}/5</option>)}
            </select>
          </Field>
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="display-font text-xl font-semibold">Product image</p>
          <p className="mt-1 text-sm text-stone-500">
            Optional. Add the first product photo now; it will become the primary image.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Primary image">
            <input
              name="primaryImage"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="field"
            />
          </Field>
          <Field label="Image description">
            <input
              name="imageAltText"
              maxLength={180}
              placeholder="e.g. Whole cumin spice jar"
              className="field"
            />
          </Field>
        </div>

        <p className="-mt-2 text-xs leading-5 text-stone-500">
          JPG, PNG, WebP or AVIF. Maximum 8 MB. Transparent PNG/WebP works well for premium jar artwork.
        </p>

        <div className="border-t border-white/10 pt-5">
          <p className="display-font text-xl font-semibold">First variant</p>
          <p className="mt-1 text-sm text-stone-500">Add the first sellable size now; variant management expands next.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
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
        </div>

        <button className="btn-primary mt-2 w-fit" type="submit">Create product</button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm"><span className="text-stone-300">{label}</span>{children}</label>;
}
