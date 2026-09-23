import { ProductCard } from "@/components/products/product-card";
import { FloatingFilterBar } from "@/components/shop/floating-filter-bar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

function topQueries(rows: Array<{ query_text: string }> | null | undefined) {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const query = row.query_text.trim().toLowerCase();
    if (!query) continue;
    counts.set(query, (counts.get(query) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([query]) => query);
}

function intersectSets(sets: Set<string>[]) {
  if (!sets.length) return null;
  const [first, ...rest] = sets;
  return [...first].filter(id => rest.every(set => set.has(id)));
}

export default async function ShopPage({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();
  const searchTerm = filters.q?.trim();
  const trendingSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: types },
    { data: cuisines },
    { data: foodTypes },
    { data: flavours },
    { data: cookingMethods },
    { data: trendingRows },
  ] = await Promise.all([
    supabase.from("product_types").select("id,name").order("name"),
    supabase.from("cuisines").select("id,name").order("name"),
    supabase.from("food_types").select("id,name").order("name"),
    supabase.from("flavours").select("id,name").order("name"),
    supabase.from("cooking_methods").select("id,name").order("name"),
    admin.from("product_searches").select("query_text").gte("created_at", trendingSince).limit(500),
  ]);

  const trending = topQueries(trendingRows);

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
    const { data: fuzzy, error: fuzzyError } = await supabase.rpc("search_catalogue", {
      search_term: searchTerm,
      result_limit: 100,
    });

    errorMessage = fuzzyError?.message ?? null;

    if (!fuzzyError && fuzzy?.length) {
      const rankedIds = fuzzy.map((row: { product_id: string }) => row.product_id);
      const rank = new Map(rankedIds.map((id: string, index: number) => [id, index]));
      const result = await makeQuery().in("id", rankedIds);
      errorMessage = result.error?.message ?? null;
      products = (result.data ?? []).sort(
        (a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999),
      );
    }

    await admin.from("product_searches").insert({
      query_text: searchTerm,
      result_count: products.length,
    });
  } else {
    const result = await makeQuery();
    products = result.data ?? [];
    errorMessage = result.error?.message ?? null;
  }

  return (
    <main className="pantry-shop min-h-screen pb-28 pt-36">
      <section className="section-wrap relative z-10">
        <header className="pantry-shop-head">
          <div>
            <p className="pantry-kicker">The pantry</p>
            <h1>Find the jar you need.</h1>
          </div>
          <p className="pantry-shop-intro">
            Search by spice, cuisine, dish, flavour, cooking method or heat.
          </p>
        </header>

        <div id="pantry-search">
          <FloatingFilterBar
            values={filters}
            types={types ?? []}
            cuisines={cuisines ?? []}
            foodTypes={foodTypes ?? []}
            flavours={flavours ?? []}
            cookingMethods={cookingMethods ?? []}
            trending={trending}
          />
        </div>

        <div className="pantry-results-bar">
          <span>{products.length} jar{products.length === 1 ? "" : "s"}</span>
          <span>{searchTerm ? `“${searchTerm}”` : "Browse all"}</span>
        </div>

        {errorMessage ? (
          <p className="mt-8 rounded-2xl border border-red-300/15 bg-red-300/10 p-4 text-red-100">
            Catalogue could not load: {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 grid gap-x-4 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>

        {!errorMessage && !products.length ? (
          <div className="pantry-empty-state">Nothing on this shelf matches those filters.</div>
        ) : null}
      </section>
    </main>
  );
}
