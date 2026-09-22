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
  id,name,slug,short_description,heat_level,product_type_id,jar_render_path,hero_render_path,
  product_variants(id,weight_value,weight_unit,retail_price_cents,stock_quantity),
  product_images(id,storage_path,alt_text,is_primary,sort_order)
`;

export const metadata = { title: "Shop" };

function intersectSets(sets: Set<string>[]) {
  if (!sets.length) return null;
  const [first, ...rest] = sets;
  return [...first].filter(id => rest.every(set => set.has(id)));
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
    relationshipResults.map(result => new Set((result.data ?? []).map(row => row.product_id))),
  );

  const makeQuery = () => {
    let query = supabase.from("products").select(productSelect).eq("is_active", true).order("name");
    if (filters.type) query = query.eq("product_type_id", filters.type);
    if (filters.heat && /^[0-5]$/.test(filters.heat)) query = query.eq("heat_level", Number(filters.heat));
    if (eligibleIds) query = query.in("id", eligibleIds.length ? eligibleIds : ["00000000-0000-0000-0000-000000000000"]);
    return query;
  };

  let products: any[] = [];
  let errorMessage: string | null = null;

  if (searchTerm) {
    const { data: aliases } = await supabase.from("product_aliases").select("product_id").ilike("alias", `%${searchTerm}%`);
    const aliasIds = [...new Set((aliases ?? []).map(row => row.product_id))];

    const [nameResult, aliasResult] = await Promise.all([
      makeQuery().ilike("name", `%${searchTerm}%`),
      aliasIds.length ? makeQuery().in("id", aliasIds) : Promise.resolve({ data: [], error: null }),
    ]);

    errorMessage = nameResult.error?.message ?? aliasResult.error?.message ?? null;
    products = Array.from(
      new Map([...(nameResult.data ?? []), ...(aliasResult.data ?? [])].map(product => [product.id, product])).values(),
    );
  } else {
    const result = await makeQuery();
    products = result.data ?? [];
    errorMessage = result.error?.message ?? null;
  }

  return (
    <main className="dark-stone relative min-h-screen pb-28 pt-32">
      <section className="section-wrap relative z-10">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="micro-label">The pantry collection</p>
            <h1 className="catalogue-heading mt-4">Choose by flavour.</h1>
            <p className="display-font mt-4 text-2xl italic text-white/58">Extraordinary spices for everyday rituals.</p>
          </div>
          <p className="max-w-md justify-self-end text-sm leading-7 text-white/48">
            Search spices, cuisines, dishes, flavour profiles and heat — or browse the full shelf.
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

        <div className="mt-9 flex items-center justify-between border-b border-white/10 pb-4">
          <span className="micro-label">{products.length} exceptional spice{products.length === 1 ? "" : "s"}</span>
          <span className="text-[10px] uppercase tracking-[.18em] text-white/35">{searchTerm ? `“${searchTerm}”` : "Live catalogue"}</span>
        </div>

        {errorMessage ? (
          <p className="mt-8 rounded-2xl border border-red-300/15 bg-red-300/10 p-4 text-red-100">
            Catalogue could not load: {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>

        {!errorMessage && !products.length ? (
          <div className="mt-16 text-center text-white/45">Nothing on this shelf matches those filters.</div>
        ) : null}
      </section>
    </main>
  );
}
