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
    <div className="floating-search mx-auto mt-10 max-w-6xl">
      <div className="search-orb rounded-[2rem] p-3">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="flex w-full items-center gap-4 rounded-[1.45rem] px-3 py-3 text-left sm:px-5"
          aria-expanded={open}
        >
          <span className="grid size-11 place-items-center rounded-full border border-white/12 bg-white/5 text-xl">⌕</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold uppercase tracking-[.24em] text-white/34">Search spices, cuisines or dishes</span>
            <span className="mt-1 block truncate display-font text-xl italic text-white/80">
              {values.q || "What are you looking for?"}
            </span>
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/35">
            {open ? "Close ↑" : "Filters ↓"}
          </span>
        </button>

        {open ? (
          <form className="border-t border-white/10 px-1 pb-1 pt-4 sm:px-2">
            <input
              name="q"
              defaultValue={values.q}
              placeholder="Search turmeric, dhana, braai blends..."
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
                <option value="">🌶 Heat level</option>
                {[0,1,2,3,4,5].map(level => <option key={level} value={level}>Heat {level}/5</option>)}
              </select>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <a href="/shop" className="btn-ghost !min-h-10 !px-4 !py-2 text-[10px] uppercase tracking-[.15em]">Clear</a>
              <button type="submit" className="btn-primary !min-h-10 !px-5 !py-2 text-[10px] uppercase tracking-[.15em]">Search →</button>
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
      {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  );
}
