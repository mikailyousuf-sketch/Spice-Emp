import { ProductCard } from "@/components/products/product-card";
import { FloatingFilterBar } from "@/components/shop/floating-filter-bar";
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

  if (filters.cuisine) relationshipQueries.push(supabase.from("product_cuisines").select("product_id").eq("cuisine_id", filters.cuisine));
  if (filters.food) relationshipQueries.push(supabase.from("product_food_types").select("product_id").eq("food_type_id", filters.food));
  if (filters.flavour) relationshipQueries.push(supabase.from("product_flavours").select("product_id").eq("flavour_id", filters.flavour));
  if (filters.method) relationshipQueries.push(supabase.from("product_cooking_methods").select("product_id").eq("cooking_method_id", filters.method));

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

    if (filters.type) query = query.eq("product_type_id", filters.type);
    if (filters.heat && /^[0-5]$/.test(filters.heat)) query = query.eq("heat_level", Number(filters.heat));
    if (eligibleIds) query = query.in("id", eligibleIds.length ? eligibleIds : ["00000000-0000-0000-0000-000000000000"]);

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
      aliasIds.length ? makeQuery().in("id", aliasIds) : Promise.resolve({ data: [], error: null }),
    ]);

    errorMessage = nameResult.error?.message ?? aliasResult.error?.message ?? null;
    products = Array.from(
      new Map([...(nameResult.data ?? []), ...(aliasResult.data ?? [])].map((product) => [product.id, product])).values(),
    );
  } else {
    const result = await makeQuery();
    products = result.data ?? [];
    errorMessage = result.error?.message ?? null;
  }

  return (
    <main className="pb-24 pt-28 sm:pt-32">
      <section className="section-wrap">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="micro-label">The pantry collection</span>
            <h1 className="display-font mt-3 text-6xl leading-[.9] tracking-[-.045em] sm:text-7xl">
              Pick a jar.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-neutral-500 md:text-right">
            Search when you need it. Otherwise, browse the shelf.
          </p>
        </div>

        <div id="pantry-search">
          <FloatingFilterBar
            values={filters}
            types={types ?? []}
            cuisines={cuisines ?? []}
            foodTypes={foodTypes ?? []}
            flavours={flavours ?? []}
            cookingMethods={cookingMethods ?? []}
          />
        </div>

        <div className="mt-7 flex items-center justify-between text-xs font-semibold uppercase tracking-[.16em] text-neutral-400">
          <span>{products.length} jar{products.length === 1 ? "" : "s"}</span>
          {searchTerm ? <span>“{searchTerm}”</span> : <span>Live catalogue</span>}
        </div>

        {errorMessage ? (
          <p className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-700">
            Catalogue could not load: {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 grid gap-x-4 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {!errorMessage && !products.length ? (
          <div className="mt-16 text-center text-neutral-500">
            Nothing on this shelf matches those filters.
          </div>
        ) : null}
      </section>
    </main>
  );
}
