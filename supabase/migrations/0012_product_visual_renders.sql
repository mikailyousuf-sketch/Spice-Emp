alter table public.products
add column jar_render_path text,
add column hero_render_path text;

comment on column public.products.jar_render_path is
  'Optional Supabase Storage path for the premium front-facing jar render used in catalogue cards.';

comment on column public.products.hero_render_path is
  'Optional Supabase Storage path for a more dramatic editorial product render used in hero/featured placements.';
