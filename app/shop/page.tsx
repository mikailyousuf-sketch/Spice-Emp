import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    cuisine?: string;
    food?: string;
    flavour?: string;
    method?: string;
    heat?: string;
  }>;
};

const productSelect = `
  id,name,slug,short_description,heat_level,product_type_id,
  product_variants(id,weight_value,weight_unit,retail_price_cents,stock_quantity),
  product_images(id,storage_path,alt_text,is_primary,sort_order)
`;

export const metadata = { title: "Shop" };

function intersectSets(sets: Set<string>[]) {
  if (!sets.length) return null;

  const [first, ...rest] = sets;
  return [...first].filter((id) => rest.every((set) => set.has(id)));
}

export default async function ShopPage({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createClient();
  const searchTerm = filters.q?.trim();

  const [
    { data: types },
    { data: cuisines },
    { data: foodTypes },
    { data: flavours },
    { data: cookingMethods },
  ] = await Promise.all([
    supabase.from("product_types").select("id,name").order("name"),
    supabase.from("cuisines").select("id,name").order("name"),
    supabase.from("food_types").select("id,name").order("name"),
    supabase.from("flavours").select("id,name").order("name"),
    supabase.from("cooking_methods").select("id,name").order("name"),
  ]);

  const relationshipQueries: Array<PromiseLike<{ data: Array<{ product_id: string }> | null }>> = [];

  if (filters.cuisine) {
    relationshipQueries.push(
      supabase.from("product_cuisines").select("product_id").eq("cuisine_id", filters.cuisine),
    );
  }

  if (filters.food) {
    relationshipQueries.push(
      supabase.from("product_food_types").select("product_id").eq("food_type_id", filters.food),
    );
  }

  if (filters.flavour) {
    relationshipQueries.push(
      supabase.from("product_flavours").select("product_id").eq("flavour_id", filters.flavour),
    );
  }

  if (filters.method) {
    relationshipQueries.push(
      supabase.from("product_cooking_methods").select("product_id").eq("cooking_method_id", filters.method),
    );
  }

  const relationshipResults = await Promise.all(relationshipQueries);
  const eligibleIds = intersectSets(
    relationshipResults.map((result) => new Set((result.data ?? []).map((row) => row.product_id))),
  );

  const makeQuery = () => {
    let query = supabase
      .from("products")
      .select(productSelect)
      .eq("is_active", true)
      .order("name");

    if (filters.type) {
      query = query.eq("product_type_id", filters.type);
    }

    if (filters.heat && /^[0-5]$/.test(filters.heat)) {
      query = query.eq("heat_level", Number(filters.heat));
    }

    if (eligibleIds) {
      query = query.in("id", eligibleIds.length ? eligibleIds : ["00000000-0000-0000-0000-000000000000"]);
    }

    return query;
  };

  let products: any[] = [];
  let errorMessage: string | null = null;

  if (searchTerm) {
    const { data: aliases } = await supabase
      .from("product_aliases")
      .select("product_id")
      .ilike("alias", `%${searchTerm}%`);

    const aliasIds = [...new Set((aliases ?? []).map((row) => row.product_id))];

    const [nameResult, aliasResult] = await Promise.all([
      makeQuery().ilike("name", `%${searchTerm}%`),
      aliasIds.length
        ? makeQuery().in("id", aliasIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    errorMessage = nameResult.error?.message ?? aliasResult.error?.message ?? null;

    const merged = [...(nameResult.data ?? []), ...(aliasResult.data ?? [])];
    products = Array.from(new Map(merged.map((product) => [product.id, product])).values());
  } else {
    const result = await makeQuery();
    products = result.data ?? [];
    errorMessage = result.error?.message ?? null;
  }

  const hasFilters = Boolean(
    searchTerm ||
    filters.type ||
    filters.cuisine ||
    filters.food ||
    filters.flavour ||
    filters.method ||
    filters.heat,
  );

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Catalogue</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em] sm:text-6xl">
          Shop spices
        </h1>

        <form className="glass-soft mt-8 grid gap-3 rounded-[2rem] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search cumin, dhana, haldi..."
            className="field sm:col-span-2"
          />

          <FilterSelect name="type" value={filters.type} label="All product types" options={types ?? []} />
          <FilterSelect name="cuisine" value={filters.cuisine} label="All cuisines" options={cuisines ?? []} />
          <FilterSelect name="food" value={filters.food} label="All foods" options={foodTypes ?? []} />
          <FilterSelect name="flavour" value={filters.flavour} label="All flavours" options={flavours ?? []} />
          <FilterSelect name="method" value={filters.method} label="All cooking methods" options={cookingMethods ?? []} />

          <select name="heat" defaultValue={filters.heat ?? ""} className="field">
            <option value="">Any heat level</option>
            {[0,1,2,3,4,5].map((level) => (
              <option key={level} value={level}>Heat {level}/5</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">Apply filters</button>
            {hasFilters ? <Link className="btn-secondary !px-4" href="/shop">Clear</Link> : null}
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-stone-500">
          <span>{products.length} product{products.length === 1 ? "" : "s"}</span>
          {searchTerm ? <span>Search: “{searchTerm}”</span> : null}
        </div>

        {errorMessage ? (
          <p className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
            Catalogue could not load: {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {!errorMessage && !products.length ? (
          <div className="glass-soft mt-8 rounded-[2rem] p-10 text-center text-stone-400">
            No catalogue products match these filters.
          </div>
        ) : null}
      </section>
    </main>
  );
}

function FilterSelect({
  name,
  value,
  label,
  options,
}: {
  name: string;
  value?: string;
  label: string;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className="field">
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.name}</option>
      ))}
    </select>
  );
}
