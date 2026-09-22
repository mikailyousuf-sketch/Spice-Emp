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
    <div className="pantry-filter-shell mx-auto mt-10 max-w-6xl">
      <div className="pantry-filter-card">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="pantry-filter-trigger"
          aria-expanded={open}
        >
          <span className="pantry-filter-icon" aria-hidden="true">⌕</span>
          <span className="min-w-0 flex-1">
            <span className="pantry-filter-kicker">Search spices, cuisines or dishes</span>
            <span className="pantry-filter-value">
              {values.q || "Search the pantry"}
            </span>
          </span>
          <span className="pantry-filter-toggle">
            {open ? "Close ↑" : "Filters ↓"}
          </span>
        </button>

        {open ? (
          <form className="pantry-filter-form">
            <input
              name="q"
              defaultValue={values.q}
              placeholder="Search turmeric, dhana, braai blends..."
              className="pantry-field pantry-field-search"
              autoFocus
            />

            <div className="pantry-filter-grid">
              <Filter name="type" value={values.type} label="🫙 Product type" options={types} />
              <Filter name="cuisine" value={values.cuisine} label="🌍 Cuisine" options={cuisines} />
              <Filter name="food" value={values.food} label="🍛 Dish / food" options={foodTypes} />
              <Filter name="flavour" value={values.flavour} label="✨ Flavour" options={flavours} />
              <Filter name="method" value={values.method} label="🔥 Cooking method" options={cookingMethods} />
              <select name="heat" defaultValue={values.heat ?? ""} className="pantry-field">
                <option value="">🌶 Heat level</option>
                {[0,1,2,3,4,5].map(level => <option key={level} value={level}>Heat {level}/5</option>)}
              </select>
            </div>

            <div className="pantry-filter-actions">
              <a href="/shop" className="pantry-filter-clear">Clear</a>
              <button type="submit" className="pantry-filter-submit">Search pantry →</button>
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
    <select name={name} defaultValue={value ?? ""} className="pantry-field">
      <option value="">{label}</option>
      {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  );
}
