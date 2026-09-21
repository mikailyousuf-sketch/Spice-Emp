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
      <div className="glass search-orb rounded-[2rem] p-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-4 rounded-[1.5rem] px-4 py-3 text-left sm:px-5"
          aria-expanded={open}
        >
          <span className="grid size-10 place-items-center rounded-full bg-black text-white">⌕</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-[.16em] text-neutral-400">
              Search the pantry
            </span>
            <span className="mt-1 block truncate text-sm text-neutral-700">
              {values.q || "Search turmeric, dhana, braai blends, Indian spices…"}
            </span>
          </span>
          <span className="text-sm text-neutral-400">{open ? "Close ↑" : "Filters ↓"}</span>
        </button>

        {open ? (
          <form className="border-t border-black/10 px-3 pb-3 pt-4 sm:px-4">
            <input
              name="q"
              defaultValue={values.q}
              placeholder="What are you looking for?"
              className="field"
              autoFocus
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Filter name="type" value={values.type} label="🫙 Product type" options={types} />
              <Filter name="cuisine" value={values.cuisine} label="🌍 Cuisine" options={cuisines} />
              <Filter name="food" value={values.food} label="🍛 Dish / food" options={foodTypes} />
              <Filter name="flavour" value={values.flavour} label="✨ Flavour" options={flavours} />
              <Filter name="method" value={values.method} label="🔥 Cooking method" options={cookingMethods} />
              <select name="heat" defaultValue={values.heat ?? ""} className="field">
                <option value="">🌶 Any heat level</option>
                {[0,1,2,3,4,5].map((level) => (
                  <option key={level} value={level}>
                    {"🌶".repeat(level || 1)} Heat {level}/5
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <a href="/shop" className="btn-secondary !min-h-10 !px-4 !py-2 text-sm">Clear</a>
              <button type="submit" className="btn-primary !min-h-10 !px-5 !py-2 text-sm">
                Search pantry
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
