"use client";

import { useState } from "react";

type Option = { id: string; name: string };

type Props = {
  values: {
    q?: string;
    type?: string;
    cuisine?: string;
    food?: string;
    flavour?: string;
    method?: string;
    heat?: string;
  };
  types: Option[];
  cuisines: Option[];
  foodTypes: Option[];
  flavours: Option[];
  cookingMethods: Option[];
};

export function FloatingFilterBar({
  values,
  types,
  cuisines,
  foodTypes,
  flavours,
  cookingMethods,
}: Props) {
  const [open, setOpen] = useState(Boolean(
    values.q || values.type || values.cuisine || values.food || values.flavour || values.method || values.heat,
  ));

  return (
    <div className="floating-search mx-auto mt-9 max-w-5xl">
      <div className="search-orb rounded-[1.7rem] p-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-4 rounded-[1.35rem] px-3 py-2.5 text-left sm:px-4"
          aria-expanded={open}
        >
          <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/10 text-lg text-white">
            ⌕
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
              Search pantry
            </span>
            <span className="mt-1 block truncate text-sm text-white/75">
              {values.q || "Turmeric, dhana, braai blends, Indian spices…"}
            </span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-white/38">
            {open ? "Hide ↑" : "Filters ↓"}
          </span>
        </button>

        {open ? (
          <form className="border-t border-white/10 px-2 pb-2 pt-4 sm:px-3">
            <input
              name="q"
              defaultValue={values.q}
              placeholder="What are you looking for?"
              className="field"
              autoFocus
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Filter name="type" value={values.type} label="🫙 Product type" options={types} />
              <Filter name="cuisine" value={values.cuisine} label="🌍 Cuisine" options={cuisines} />
              <Filter name="food" value={values.food} label="🍛 Dish / food" options={foodTypes} />
              <Filter name="flavour" value={values.flavour} label="✨ Flavour" options={flavours} />
              <Filter name="method" value={values.method} label="🔥 Cooking method" options={cookingMethods} />
              <select name="heat" defaultValue={values.heat ?? ""} className="field">
                <option value="">🌶 Heat</option>
                {[0,1,2,3,4,5].map((level) => (
                  <option key={level} value={level}>
                    Heat {level}/5
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <a
                href="/shop"
                className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[.12em] text-white/70 transition hover:bg-white hover:text-black"
              >
                Clear
              </a>
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[.12em] text-black transition hover:-translate-y-0.5"
              >
                Apply
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function Filter({
  name,
  value,
  label,
  options,
}: {
  name: string;
  value?: string;
  label: string;
  options: Option[];
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
