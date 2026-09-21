create extension if not exists pg_trgm;

create index if not exists products_name_trgm_idx
on public.products using gin (name gin_trgm_ops);

create index if not exists product_aliases_alias_trgm_idx
on public.product_aliases using gin (alias gin_trgm_ops);

create index if not exists product_cuisines_cuisine_idx
on public.product_cuisines(cuisine_id, product_id);

create index if not exists product_food_types_food_idx
on public.product_food_types(food_type_id, product_id);

create index if not exists product_flavours_flavour_idx
on public.product_flavours(flavour_id, product_id);

create index if not exists product_cooking_methods_method_idx
on public.product_cooking_methods(cooking_method_id, product_id);
