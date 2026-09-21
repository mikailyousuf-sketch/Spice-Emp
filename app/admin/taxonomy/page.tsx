import { createClient } from "@/lib/supabase/server";
import { createTaxonomyItem, deleteTaxonomyItem } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Taxonomy" };

const groups = [
  { table: "product_types", title: "Product types" },
  { table: "cuisines", title: "Cuisines" },
  { table: "food_types", title: "Food types" },
  { table: "flavours", title: "Flavours" },
  { table: "cooking_methods", title: "Cooking methods" },
] as const;

export default async function TaxonomyPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const results = await Promise.all(
    groups.map(async (group) => ({
      ...group,
      items: (await supabase.from(group.table).select("id,name,slug").order("name")).data ?? [],
    })),
  );

  return (
    <section>
      <span className="eyebrow">Catalogue configuration</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Taxonomy</h1>
      <p className="mt-4 max-w-2xl text-stone-400">
        Maintain the classification options used by product discovery and filters.
      </p>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
          Taxonomy updated.
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {results.map((group) => (
          <section key={group.table} className="glass-soft rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="display-font text-2xl font-semibold">{group.title}</h2>
              <span className="text-sm text-stone-600">{group.items.length}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <form
                  key={item.id}
                  action={deleteTaxonomyItem}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-sm"
                >
                  <input type="hidden" name="table" value={group.table} />
                  <input type="hidden" name="id" value={item.id} />
                  <span>{item.name}</span>
                  <button
                    type="submit"
                    className="text-stone-600 hover:text-red-300"
                    aria-label={`Delete ${item.name}`}
                  >
                    ×
                  </button>
                </form>
              ))}
            </div>

            <form action={createTaxonomyItem} className="mt-6 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="table" value={group.table} />
              <input name="name" required placeholder="Name" className="field" />
              <input name="slug" required placeholder="slug-format" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="field" />
              <button className="btn-secondary w-fit sm:col-span-2" type="submit">Add {group.title.toLowerCase().replace(/s$/, "")}</button>
            </form>
          </section>
        ))}
      </div>
    </section>
  );
}
