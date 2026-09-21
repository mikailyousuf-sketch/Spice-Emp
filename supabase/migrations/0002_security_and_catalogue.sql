create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

create policy "public can read product images"
on public.product_images for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.is_active = true
  )
);

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin'::public.app_role)
      or public.has_role('super_admin'::public.app_role);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer'::public.app_role)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "users can read own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "admins manage products"
on public.products for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage variants"
on public.product_variants for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage aliases"
on public.product_aliases for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage images"
on public.product_images for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product cuisines"
on public.product_cuisines for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product foods"
on public.product_food_types for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product flavours"
on public.product_flavours for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product cooking methods"
on public.product_cooking_methods for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product types"
on public.product_types for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage cuisines"
on public.cuisines for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage food types"
on public.food_types for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage flavours"
on public.flavours for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins manage cooking methods"
on public.cooking_methods for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create index if not exists products_slug_idx on public.products (slug);
create index if not exists variants_product_id_idx on public.product_variants (product_id);
create index if not exists aliases_product_id_idx on public.product_aliases (product_id);
